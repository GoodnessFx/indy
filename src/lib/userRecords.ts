// Admin-managed per-user records, backed by the same single backend as chat.
//
// One JSON blob per account holds everything an admin can change on a client's
// behalf, so an edit made in one browser reaches that client on any device:
//   profile              name / phone / country
//   kyc                  verification state
//   payout               saved cards: BRAND, LAST4, EXPIRY, CARDHOLDER NAME
//                        ONLY — never a full card number (see CARD DATA RULE)
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

import { API_BASE } from "./config";
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
}

export interface BalanceAdjustment {
  id: string;
  amount: number;
  reason: string;
  at: string;
  admin: string;
}

export interface UserRecord {
  email: string;
  profile?: { name?: string; phone?: string; country?: string };
  kyc?: "unverified" | "pending" | "verified" | "rejected" | "";
  payout?: PayoutCard[];
  balanceAdjustments?: BalanceAdjustment[];
  deleted?: boolean;
  deletedAt?: string;
  updatedAt?: string;
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

function emptyRecord(email: string): UserRecord {
  return { email, profile: {}, kyc: "", payout: [], balanceAdjustments: [], deleted: false };
}

// --- local mirror (offline fallback + instant first paint) ---

function localRecord(email: string): UserRecord {
  try {
    const raw = localStorage.getItem(RECORD_PREFIX + email.toLowerCase());
    if (raw) return { ...emptyRecord(email), ...(JSON.parse(raw) as UserRecord) };
  } catch { /* ignore */ }
  return emptyRecord(email);
}

function writeLocal(rec: UserRecord): void {
  try {
    localStorage.setItem(RECORD_PREFIX + rec.email.toLowerCase(), JSON.stringify(rec));
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
  const url = path.startsWith("/api/") ? `${API_BASE}${path.slice(4)}` : path;
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`record API ${res.status}`);
  return res.json();
}

/** Fetch one client's record. Server first, then local mirror. */
export async function fetchUserRecord(email: string): Promise<UserRecord> {
  try {
    const rows = (await api(
      `/api/users/record?email=${encodeURIComponent(email)}`
    )) as UserRecord;
    if (rows && typeof rows === "object" && "email" in rows) {
      const rec = { ...emptyRecord(email), ...(rows as UserRecord) };
      writeLocal(rec);
      return rec;
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
        writeLocal(rec);
        return rec;
      }
    } catch { /* ignore */ }
  }
  return localRecord(email);
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

