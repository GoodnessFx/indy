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