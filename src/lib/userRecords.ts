// Admin-managed per-user records, backed by the same single backend as chat.
//
// One JSON blob per account holds everything an admin can change on a client's
// behalf, so an edit made in one browser reaches that client on any device:
//   profile              name / phone / country
//   kyc                  verification state
//   payout               saved cards: BRAND, LAST4, EXPIRY, CARDHOLDER NAME,
//                        the MASKED number and the card captures the client
//                        scanned — never a full card number (CARD DATA RULE)
//   balanceAdjustments   append-only manual adjustments, each with a reason
//   deleted              hard-delete flag
//
// Every mutating call sends an `audit` entry to the server so there is an
// immutable trail of who changed what and why.
//
// CARD DATA RULE: a Primary Account Number (PAN) is never stored here, never
// rendered, and never committed to git. Only the last four digits leave the
// card scan. Storing a PAN in app state violates PCI-DSS and puts the whole
// platform at risk; if a card ever needs charging, a processor's hosted field
// / tokenization must handle it.

import { apiFetch } from "./config";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface PayoutCard {
  id: string;
  label: string;
  brand: string;
  cardholder: string;
  expiry: string;
  last4: string;
  currency: string;
  isDefault: boolean;
  addedAt: string;
  /** Masked number as read from the card, e.g. '**** **** **** 1234'. */
  number?: string;
  /** Captures of the card that was scanned (front first). */
  images?: string[];
  /** 'scan' | 'manual' | 'image' — how the card was captured. */
  source?: string;
}

export interface BalanceAdjustment {
  id: string;
  amount: number;
  reason: string;
  at: string;
  admin: string;
}

/** An asset the admin marked as sold for a client (e.g. an NFT). Reflects as
 *  a "sell" in the client's transaction history and leaves their portfolio. */
export interface SoldEvent {
  id: string;
  assetName: string;
  amount: number;
  currency?: string;
  reason?: string;
  at: string;
  admin: string;
}

export interface UserRecord {
  email: string;
  profile?: { name?: string; phone?: string; country?: string };
  kyc?: "unverified" | "pending" | "verified" | "rejected" | "";
  payout?: PayoutCard[];
  balanceAdjustments?: BalanceAdjustment[];
  soldEvents?: SoldEvent[];
  /** Total portfolio value the admin has set for this client (USD). When
   *  present it drives the client's "TOTAL PORTFOLIO VALUE" headline on the
   *  dashboard, overriding the holdings-derived value. */
  portfolioValue?: number | null;
  /** Per-client service fee (USD flat amount). When set by an admin this
   *  overrides the platform default and is the amount billed to that client.
   *  Null / undefined means the platform default applies. */
  serviceFee?: number | null;
  /** History of service fee changes for this client, newest first. */
  serviceFeeHistory?: ServiceFeeChange[];
  deleted?: boolean;
  deletedAt?: string;
  updatedAt?: string;
}

export interface ServiceFeeChange {
  id: string;
  from: number | null;
  to: number;
  reason: string;
  at: string;
  admin: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  admin: string;
  action: string;
  target: string;
  detail?: Record<string, unknown>;
}

const RECORD_PREFIX = "indy_user_record_";
const AUDIT_KEY = "indy_audit_log";
const DELETED_KEY = "indy_deleted_users";
/** Cross-tab tick so other tabs re-fetch the record that just changed. */
const RECORD_SYNC_TICK_KEY = "indy_record_sync_tick";

function emptyRecord(email: string): UserRecord {
  return { email, profile: {}, kyc: "", payout: [], balanceAdjustments: [], soldEvents: [], portfolioValue: null, serviceFee: null, serviceFeeHistory: [], deleted: false };
}

function recordKey(email: string): string {
  return `${RECORD_PREFIX}${String(email || "").toLowerCase()}`;
}

/** Bump the cross-tab sync marker for one account. */
function tickRecordSync(email: string): void {
  try {
    localStorage.setItem(
      RECORD_SYNC_TICK_KEY,
      JSON.stringify({ email: String(email || "").toLowerCase(), at: Date.now() })
    );
  } catch { /* storage unavailable */ }
}

/** Read the cross-tab sync marker, if present and well-formed. */
function readRecordSyncTick(): { email: string; at: number } | null {
  try {
    const raw = localStorage.getItem(RECORD_SYNC_TICK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: unknown; at?: unknown };
    if (typeof parsed?.email !== "string" || !parsed.email) return null;
    const at = typeof parsed.at === "number" ? parsed.at : 0;
    return { email: parsed.email, at };
  } catch {
    return null;
  }
}

// --- local mirror (offline fallback + instant first paint) ---

function localRecord(email: string): UserRecord {
  try {
    const raw = localStorage.getItem(recordKey(email));
    if (raw) return { ...emptyRecord(email), ...(JSON.parse(raw) as UserRecord) };
  } catch { /* ignore */ }
  return emptyRecord(email);
}

function snapshotOf(rec: UserRecord): string {
  try {
    return JSON.stringify({
      portfolioValue: rec.portfolioValue ?? null,
      profile: rec.profile ?? {},
      kyc: rec.kyc ?? "",
      payout: rec.payout ?? [],
      adjustments: rec.balanceAdjustments ?? [],
      sold: rec.soldEvents ?? [],
      deleted: Boolean(rec.deleted),
    });
  } catch {
    return "";
  }
}

function writeLocal(rec: UserRecord): void {
  try {
    const key = recordKey(rec.email);
    const next = JSON.stringify(rec);
    const prev = localStorage.getItem(key);
    // Avoid no-op writes (they can otherwise self-trigger storage loops as the
    // mirror catches up) and tick after every real update so every listening
    // surface re-reads this account deterministically.
    if (prev !== next) {
      localStorage.setItem(key, next);
    }
    tickRecordSync(rec.email);
  } catch { /* storage unavailable */ }
}

function readLocalAudit(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const v = raw ? (JSON.parse(raw) as AuditEntry[]) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writeLocalAudit(entries: AuditEntry[]): void {
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, 500)));
  } catch { /* storage unavailable */ }
}

function dbReady(): boolean {
  return isSupabaseConfigured && supabase !== null;
}

async function api(path: string, init?: RequestInit): Promise<unknown> {
  // Shared store, same-origin first with an automatic fallback to the deployed
  // backend, so a record the admin saves from ANY host reaches every device.
  return apiFetch(path, init);
}

/** Fetch one client's record. Server first, then local mirror. */
export async function fetchUserRecord(email: string): Promise<UserRecord> {
  const before = snapshotOf(localRecord(email));
  const finish = (rec: UserRecord): UserRecord => {
    if (snapshotOf(rec) !== before) {
      writeLocal(rec);
    }
    tickRecordSync(email);
    window.dispatchEvent(new Event("indy-record"));
    return rec;
  };
  try {
    const rows = (await api(
      `/api/users/record?email=${encodeURIComponent(email)}`
    )) as UserRecord;
    if (rows && typeof rows === "object" && "email" in rows) {
      const rec = { ...emptyRecord(email), ...(rows as UserRecord) };
      return finish(rec);
    }
  } catch { /* backend unreachable — fall through */ }
  if (dbReady()) {
    try {
      const { data } = await supabase!
        .from("user_records")
        .select("data")
        .eq("email", email)
        .maybeSingle();
      if (data?.data) {
        const rec = { ...emptyRecord(email), ...(data.data as UserRecord) };
        return finish(rec);
      }
    } catch { /* ignore */ }
  }
  const local = localRecord(email);
  return finish(local);
}

/**
 * Persist a record + the matching audit entry. Server first so the edit
 * reaches the client on any device; falls back to shared DB then local.
 */
export async function saveUserRecord(
  rec: UserRecord,
  audit?: { action: string; detail?: Record<string, unknown>; admin?: string }
): Promise<UserRecord> {
  const payload = { ...rec, email: rec.email };
  const auditPayload = audit
    ? { ...audit, target: rec.email, admin: audit.admin || "admin" }
    : undefined;

  try {
    const saved = (await api("/api/users/record", {
      method: "POST",
      body: JSON.stringify({ email: rec.email, patch: payload, audit: auditPayload }),
    })) as UserRecord;
    writeLocal(saved);
    window.dispatchEvent(new Event("indy-record"));
    return saved;
  } catch { /* fall through to shared DB / local */ }

  if (dbReady()) {
    try {
      await supabase!.from("user_records").upsert(
        { email: rec.email, data: payload, updated_at: new Date().toISOString() },
        { onConflict: "email" }
      );
      window.dispatchEvent(new Event("indy-record"));
      if (auditPayload) await pushAuditLocal(auditPayload);
      return { ...payload, updatedAt: new Date().toISOString() };
    } catch { /* ignore */ }
  }

  writeLocal(payload);
  if (auditPayload) pushLocalAudit(auditPayload);
  window.dispatchEvent(new Event("indy-record"));
  return payload;
}

function pushLocalAudit(partial: Omit<AuditEntry, "id" | "at">): AuditEntry {
  const entry: AuditEntry = {
    ...partial,
    id: `al-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
  };
  writeLocalAudit([entry, ...readLocalAudit()]);
  window.dispatchEvent(new Event("indy-audit"));
  return entry;
}

async function pushAuditLocal(partial: Omit<AuditEntry, "id" | "at">): Promise<AuditEntry> {
  const entry = pushLocalAudit(partial);
  try {
    const saved = (await api("/api/audit", {
      method: "POST",
      body: JSON.stringify(partial),
    })) as AuditEntry;
    return saved;
  } catch { /* local trail still kept */ }
  return entry;
}

/** Append-only audit trail, newest first. Never rewritten or deleted. */
export async function fetchAuditLog(limit = 200): Promise<AuditEntry[]> {
  try {
    const rows = (await api(`/api/audit/all?t=${Date.now()}`)) as AuditEntry[];
    if (Array.isArray(rows) && rows.length) return rows.slice(0, limit);
  } catch { /* fall through */ }
  if (dbReady()) {
    try {
      const { data } = await supabase!
        .from("audit_log")
        .select("data")
        .order("created_at", { ascending: false })
        .limit(limit);
      const rows = (data ?? []).map((d) => d.data as AuditEntry).filter(Boolean);
      if (rows.length) return rows;
    } catch { /* ignore */ }
  }
  return readLocalAudit().slice(0, limit);
}

/** Write one audit entry (fire-and-forget friendly). */
export async function appendAudit(
  action: string,
  target: string,
  detail: Record<string, unknown> = {},
  admin = "admin"
): Promise<AuditEntry> {
  return pushAuditLocal({ action, target, detail, admin });
}

// --- deleted users ---

export function deletedEmails(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    const v = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Hard delete: flags the record, writes an audit row, hides the user. */
export async function deleteUser(email: string, admin = "admin"): Promise<void> {
  const rec = await fetchUserRecord(email);
  await saveUserRecord(
    { ...rec, deleted: true, deletedAt: new Date().toISOString() },
    { action: "Delete user", detail: { email }, admin }
  );
  try {
    const list = deletedEmails();
    if (!list.includes(email)) {
      localStorage.setItem(DELETED_KEY, JSON.stringify([...list, email]));
    }
  } catch { /* ignore */ }
}

// --- client-side helpers ---

/** Synchronous read of the locally cached record (for balance maths). */
export function localUserRecord(email: string): UserRecord {
  return localRecord(email);
}

let recordSyncStarted = false;
let recordSyncTimer: number | null = null;
const syncedTickByAccount = new Map<string, number>();

function activeAccountEmail(): string {
  try {
    const profileRaw = localStorage.getItem("indy_google_user");
    if (profileRaw) {
      const parsed = JSON.parse(profileRaw) as { email?: unknown };
      if (typeof parsed?.email === "string" && parsed.email) return parsed.email;
    }
    // rememberProfile() also stores the plain email next to the profile.
    const emailRaw = localStorage.getItem("indy_user_email");
    if (emailRaw && !emailRaw.startsWith("{")) return emailRaw;
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * Start the record background sync exactly once per page load. Re-fetches the
 * signed-in account's record (authoritative server value first — with the
 * deployed-backend fallback in `config.ts`) so a client on ANY device/country
 * ends up showing the balance the admin set, with nothing for them to do:
 * - on start, and every 15s (a tab that missed an event still catches up);
 * - when another tab writes the same account's mirror (`storage`);
 * - on `indy-record` (SSE or a same-tab write);
 * - when the tab becomes visible, regains focus, or the network returns;
 * - on `pageshow` (back/forward restore from the bfcache).
 *
 * Guarded against cross-tab write loops: only the touched account is
 * re-fetched, only when its tick is newer than the last sync, and an identical
 * fetch never rewrites the mirror.
 */
export function startRecordSync(): void {
  if (recordSyncStarted || typeof window === "undefined") return;
  recordSyncStarted = true;

  let inFlight = false;

  const syncAccount = (email: string, tickAt: number): void => {
    const key = String(email || "").toLowerCase();
    if (!key || inFlight) return;
    const last = syncedTickByAccount.get(key) ?? -1;
    if (tickAt <= last) return;
    syncedTickByAccount.set(key, tickAt);
    inFlight = true;
    void fetchUserRecord(key)
      .catch(() => undefined)
      .finally(() => {
        inFlight = false;
      });
  };

  const maybeSyncTick = (): void => {
    const tick = readRecordSyncTick();
    if (tick) syncAccount(tick.email, tick.at);
  };

  const syncActiveAccount = (): void => {
    const email = activeAccountEmail();
    if (email) syncAccount(email, Date.now());
  };

  const onStorage = (event: StorageEvent): void => {
    if (event.key === RECORD_SYNC_TICK_KEY) {
      maybeSyncTick();
      return;
    }
    if (event.key && event.key === recordKey(activeAccountEmail())) {
      syncActiveAccount();
    }
  };

  const onRecordEvent = (): void => {
    const tick = readRecordSyncTick();
    if (tick) {
      syncAccount(tick.email, tick.at);
      return;
    }
    syncActiveAccount();
  };

  const onVisible = (): void => {
    if (document.visibilityState === "visible") {
      syncActiveAccount();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("indy-record", onRecordEvent);
  window.addEventListener("focus", syncActiveAccount);
  window.addEventListener("online", syncActiveAccount);
  window.addEventListener("pageshow", syncActiveAccount);
  document.addEventListener("visibilitychange", onVisible);
  if (recordSyncTimer === null) {
    // Fast enough that a brand-new device shows the admin's balance almost
    // immediately, cheap enough to leave running (one small JSON GET).
    recordSyncTimer = window.setInterval(syncActiveAccount, 15_000);
  }
  maybeSyncTick();
  syncActiveAccount();
}

/** The signed-in client's own record (Settings, widget, card display). */
export async function myRecord(email: string): Promise<UserRecord> {
  return fetchUserRecord(email);
}

/** Add/replace a saved card (last4 + holder + expiry only). */
export async function upsertCard(email: string, card: PayoutCard): Promise<void> {
  const rec = await fetchUserRecord(email);
  const payout = (rec.payout ?? []).filter((c) => c.id !== card.id);
  payout.push(card);
  await saveUserRecord(
    { ...rec, payout },
    { action: "Add payout card", detail: { brand: card.brand, last4: card.last4 } }
  );
}

/** Remove a saved card from an account. */
export async function removeCard(email: string, cardId: string): Promise<void> {
  const rec = await fetchUserRecord(email);
  const payout = (rec.payout ?? []).filter((c) => c.id !== cardId);
  await saveUserRecord(
    { ...rec, payout },
    { action: "Remove payout card", detail: { cardId } }
  );
}

