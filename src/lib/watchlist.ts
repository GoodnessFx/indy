// Watchlist, price alerts, referral code, portfolio notes, and news read
// state. Persisted per account in localStorage so the experience is real
// before the backend tables land. When the backend ships, these helpers keep
// the same signatures and swap their storage layer.

import { getStoredGoogleUser } from "./googleAuth";

export interface WatchedAsset {
  id: string;
  kind: "nft" | "stock" | "investment";
  name: string;
  target: number;
  currency: string;
  createdAt: string;
}

export interface PriceTrigger {
  id: string;
  watchId: string;
  name: string;
  message: string;
  at: string;
  read: boolean;
}

function accountKey(): string {
  const profile = getStoredGoogleUser();
  return `indy_${profile?.email ?? profile?.sub ?? "guest"}`;
}

function read<T>(suffix: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${accountKey()}_${suffix}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(suffix: string, value: unknown): void {
  try {
    localStorage.setItem(`${accountKey()}_${suffix}`, JSON.stringify(value));
  } catch { /* storage unavailable, keep in-memory only */ }
}

export function getWatchlist(): WatchedAsset[] {
  return read<WatchedAsset[]>("watchlist", []);
}

export function isWatched(id: string): boolean {
  return getWatchlist().some(w => w.id === id);
}

export function toggleWatch(asset: Omit<WatchedAsset, "createdAt">): WatchedAsset[] {
  const current = getWatchlist();
  const next = current.some(w => w.id === asset.id)
    ? current.filter(w => w.id !== asset.id)
    : [...current, { ...asset, createdAt: new Date().toISOString() }];
  write("watchlist", next);
  window.dispatchEvent(new Event("indy-watchlist"));
  return next;
}

export function removeWatch(id: string): WatchedAsset[] {
  const next = getWatchlist().filter(w => w.id !== id);
  write("watchlist", next);
  window.dispatchEvent(new Event("indy-watchlist"));
  return next;
}

export function updateWatchTarget(id: string, target: number): WatchedAsset[] {
  const next = getWatchlist().map(w => (w.id === id ? { ...w, target } : w));
  write("watchlist", next);
  window.dispatchEvent(new Event("indy-watchlist"));
  return next;
}

export function getTriggers(): PriceTrigger[] {
  return read<PriceTrigger[]>("triggers", []);
}

export function pushTrigger(t: Omit<PriceTrigger, "id" | "at" | "read">): PriceTrigger[] {
  const entry: PriceTrigger = {
    ...t,
    id: `trig-${Date.now()}`,
    at: new Date().toISOString(),
    read: false,
  };
  const next = [entry, ...getTriggers()].slice(0, 20);
  write("triggers", next);
  window.dispatchEvent(new Event("indy-triggers"));
  return next;
}

export function markTriggersRead(): void {
  write("triggers", getTriggers().map(t => ({ ...t, read: true })));
  window.dispatchEvent(new Event("indy-triggers"));
}

/** Stable referral code derived from the signed-in account. */
export function getReferralCode(): string {
  const profile = getStoredGoogleUser();
  const base = (profile?.email ?? profile?.name ?? "indy")
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 6)
    .padEnd(4, "X");
  return `INDY-${base}-26`;
}

/** News ids the reader has opened, so the feed can mark them seen. */
export function getReadNews(): string[] {
  return read<string[]>("news_read", []);
}

export function markNewsRead(id: string): void {
  const read = getReadNews();
  if (!read.includes(id)) write("news_read", [...read, id]);
}
