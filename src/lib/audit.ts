// Client login + admin activity recording. Every client sign-in is appended to
// a feed the admin console reads, so the ops team can see who logged in and
// when. Persisted in localStorage until the backend audit table ships; the
// function names stay the same when it does.

import { getStoredGoogleUser } from "./googleAuth";

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
  image: string;
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
}): ScanEvent {
  const profile = getStoredGoogleUser();
  const entry: ScanEvent = {
    id: `scan-${Date.now().toString(36)}`,
    label: scan.label,
    last4: scan.last4,
    currency: scan.currency ?? "USD",
    account: profile?.email ?? profile?.name ?? "Unknown client",
    image: scan.image,
    at: new Date().toISOString(),
  };
  push(SCAN_KEY, entry, 60);
  window.dispatchEvent(new Event("indy-scans"));
  return entry;
}

export function scanFeed(): ScanEvent[] {
  return read<ScanEvent>(SCAN_KEY);
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