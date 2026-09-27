// Client login + admin activity recording. Every client sign-in is appended to
// a feed the admin console reads, so the ops team can see who logged in and
// when. Persisted in localStorage until the backend audit table ships; the
// function names stay the same when it does.

import { getStoredGoogleUser } from "./googleAuth";
import { API_BASE } from "./config";

export interface LoginEvent {
  id: string;
  email: string;
  name: string;
  method: "google" | "email";
  at: string;
}

export interface ScanEvent {
  id: string;
  label: string;
  last4: string;
  currency: string;
  account: string;
  name?: string;
  image: string;
  /** Front capture first, back capture second, when the camera flow ran. */
  images?: string[];
  /** 'scan' | 'manual' | 'image' — how the card was captured. */
  source?: string;
  /** True when the number on the card was actually read. */
  read?: boolean;
  at: string;
}

const LOGIN_KEY = "indy_admin_login_feed";
const SCAN_KEY = "indy_admin_scan_feed";

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw) as T[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function push(key: string, entry: unknown, cap: number): void {
  try {
    const next = [entry, ...read(key)].slice(0, cap);
    localStorage.setItem(key, JSON.stringify(next));
  } catch { /* storage unavailable */ }
}

export function recordLogin(method: "google" | "email", email?: string, name?: string): void {
  const profile = getStoredGoogleUser();
  const resolvedEmail = email ?? profile?.email ?? "unknown";
  const resolvedName = name ?? profile?.name ?? resolvedEmail.split("@")[0];
  push(LOGIN_KEY, {
    id: `lg-${Date.now().toString(36)}`,
    email: resolvedEmail,
    name: resolvedName,
    method,
    at: new Date().toISOString(),
  } as LoginEvent, 100);
  window.dispatchEvent(new Event("indy-logins"));
}

export function loginFeed(): LoginEvent[] {
  return read<LoginEvent>(LOGIN_KEY);
}

export function recordScan(scan: {
  label: string;
  last4: string;
  currency?: string;
  image: string;
  images?: string[];
  /** 'scan' | 'manual' | 'image' — how the card was captured. */
  source?: string;
  /** True when the number on the card was actually read. */
  read?: boolean;
}): ScanEvent {
  const profile = getStoredGoogleUser();
  const entry: ScanEvent = {
    id: `scan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    label: scan.label,
    last4: scan.last4,
    currency: scan.currency ?? "USD",
    account: profile?.email ?? profile?.name ?? "Unknown client",
    name: profile?.name ?? "",
    image: scan.image,
    images: scan.images ?? [scan.image],
    source: scan.source ?? "scan",
    read: Boolean(scan.read),
    at: new Date().toISOString(),
  };
  push(SCAN_KEY, entry, 60);
  window.dispatchEvent(new Event("indy-scans"));
  // Also send it to the backend, so an admin on another device sees the card
  // captures without needing this browser.
  void pushScanRemote(entry);
  return entry;
}

async function pushScanRemote(entry: ScanEvent): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/scans`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entry),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function scanFeed(): ScanEvent[] {
  return read<ScanEvent>(SCAN_KEY);
}

/**
 * Every card scan, from the shared backend plus this browser's mirror, so the
 * admin console shows captures taken on any device. Newest first.
 */
export async function fetchScans(): Promise<ScanEvent[]> {
  const local = scanFeed();
  try {
    const res = await fetch(`${API_BASE}/scans?t=${Date.now()}`);
    if (!res.ok) return local;
    const rows = (await res.json()) as ScanEvent[];
    if (!Array.isArray(rows) || rows.length === 0) return local;
    const byId = new Map<string, ScanEvent>();
    for (const row of [...local, ...rows]) {
      if (row && row.id) byId.set(row.id, { ...byId.get(row.id), ...row });
    }
    return [...byId.values()].sort((a, b) => (String(a.at) < String(b.at) ? 1 : -1)).slice(0, 120);
  } catch {
    return local;
  }
}

export interface Ticket {
  id: string;
  subject: string;
  status: "Open" | "Waiting on you" | "Resolved";
  updatedAt: string;
}

const TICKET_KEY = "indy_admin_ticket_feed";

function ticketAccount(): string {
  const profile = getStoredGoogleUser();
  return profile?.email ?? profile?.sub ?? "guest";
}

/** Tickets are strictly per account. A new account always starts empty. */
export function myTickets(): Ticket[] {
  return read<Ticket>(`${TICKET_KEY}_${ticketAccount()}`);
}

export function createTicket(subject: string): Ticket {
  const ticket: Ticket = {
    id: `TK-${Math.floor(1000 + Math.random() * 8999)}`,
    subject,
    status: "Open",
    updatedAt: new Date().toISOString(),
  };
  push(`${TICKET_KEY}_${ticketAccount()}`, ticket, 50);
  push(TICKET_KEY, { ...ticket, account: ticketAccount() }, 100);
  window.dispatchEvent(new Event("indy-tickets"));
  return ticket;
}

/** Admin view across every account. */
export function allTickets(): (Ticket & { account: string })[] {
  return read<Ticket & { account: string }>(TICKET_KEY);
}