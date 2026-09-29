// Client wallet: funding and balance.
//
// A brand new account always starts at zero and stays at zero until the client
// deposits. Deposits are stored per account, surfaced in Transaction History,
// and shown to the admin console alongside the other feeds.

import { getStoredGoogleUser } from "./googleAuth";
import { myOrders } from "./orders";
import { localUserRecord } from "./userRecords";

export interface Deposit {
  id: string;
  amount: number;
  currency: string;
  method: "bank" | "card" | "crypto";
  network?: string;
  at: string;
}

export interface Withdrawal {
  id: string;
  /** Gross amount deducted (USD). */
  amount: number;
  fee: number;
  tax: number;
  /** Amount landing in the destination currency after fees + FX. */
  net: number;
  /** Destination currency (e.g. GBP / EUR). */
  currency: string;
  destination: string;
  last4: string;
  status: "pending" | "processing" | "completed";
  /** Payment screenshot the client uploaded as proof of the BTC fee. */
  proof?: { name: string; url?: string; dataUrl?: string } | null;
  at: string;
}

// The single set of receiving addresses shown on the deposit screen.
export const DEPOSIT_ADDRESSES = {
  eth: "0x4513744a21233e451b4C0BA24fA6876862850861",
  btc: "bc1qrpkz8yg4crx36a8cq5vqfygk608kyh6jcpw468",
} as const;

function account(): string {
  const profile = getStoredGoogleUser();
  return profile?.email ?? profile?.sub ?? "guest";
}

const KEY = () => `indy_deposits_${account()}`;
const ADMIN_KEY = "indy_admin_deposit_feed";
const W_KEY = () => `indy_withdrawals_${account()}`;
const W_ADMIN_KEY = "indy_admin_withdrawal_feed";

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

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
}

export function myDeposits(): Deposit[] {
  return read<Deposit>(KEY());
}

export function adminDeposits(): (Deposit & { account: string })[] {
  return read<Deposit & { account: string }>(ADMIN_KEY);
}

export function myWithdrawals(): Withdrawal[] {
  return read<Withdrawal>(W_KEY());
}

export function adminWithdrawals(): (Withdrawal & { account: string })[] {
  return read<Withdrawal & { account: string }>(W_ADMIN_KEY);
}

/** Total gross amount withdrawn so far (USD), used to reduce the balance. */
function withdrawalsTotal(): number {
  return myWithdrawals().reduce((sum, w) => sum + w.amount, 0);
}

export function recordDeposit(input: {
  amount: number;
  currency: string;
  method: Deposit["method"];
  network?: string;
}): Deposit {
  const deposit: Deposit = {
    id: `dep-${Date.now().toString(36)}`,
    amount: input.amount,
    currency: input.currency,
    method: input.method,
    network: input.network,
    at: new Date().toISOString(),
  };
  write(KEY(), [deposit, ...read<Deposit>(KEY())]);
  write(ADMIN_KEY, [{ ...deposit, account: account() }, ...read<Deposit & { account: string }>(ADMIN_KEY)].slice(0, 100));
  window.dispatchEvent(new Event("indy-wallet"));
  window.dispatchEvent(new Event("indy-orders"));
  return deposit;
}

/**
 * Available balance in USD: everything deposited minus everything already
 * committed to paid investments and withdrawn, plus/minus any admin-recorded
 * balance adjustment. Each adjustment requires a reason and is written to the
 * audit trail — there is no silent edit of a money field.
 */
export function accountBalance(): number {
  const rec = localUserRecord(account());
  // When the admin has set a total portfolio value, that funded amount is the
  // client's balance — on a fresh account with no deposits this is exactly what
  // the admin posted, so the client's available balance matches their portfolio.
  if (typeof rec.portfolioValue === "number") {
    return Math.max(0, Math.round((rec.portfolioValue - withdrawalsTotal()) * 100) / 100);
  }
  const funded = myDeposits().reduce((sum, d) => sum + d.amount, 0);
  const spent = myOrders()
    .filter(o => o.status === "active")
    .reduce((sum, o) => sum + o.amount, 0);
  const adjustments = (localUserRecord(account()).balanceAdjustments ?? [])
    .reduce((sum, a) => sum + a.amount, 0);
  return Math.max(0, Math.round((funded - spent + adjustments - withdrawalsTotal()) * 100) / 100);
}

export function recordWithdrawal(input: {
  amount: number;
  fee: number;
  tax: number;
  net: number;
  currency: string;
  destination: string;
  last4: string;
  proof?: { name: string; url?: string; dataUrl?: string } | null;
}): Withdrawal {
  const w: Withdrawal = {
    ...input,
    id: `wd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    status: "pending",
    at: new Date().toISOString(),
  };
  write(W_KEY(), [w, ...read<Withdrawal>(W_KEY())]);
  write(
    W_ADMIN_KEY,
    [{ ...w, account: account() }, ...read<Withdrawal & { account: string }>(W_ADMIN_KEY)].slice(0, 100)
  );
  window.dispatchEvent(new Event("indy-wallet"));
  window.dispatchEvent(new Event("indy-orders"));
  return w;
}

/**
 * Admin reviews a withdrawal (e.g. verifies the uploaded payment screenshot)
 * and updates it — status flips to "completed" once approved. Mirrored into
 * the client's list, the admin feed, and broadcast to any open session.
 */
export function updateWithdrawal(
  id: string,
  patch: Partial<Pick<Withdrawal, "status">>
): void {
  const apply = (list: Withdrawal[]) =>
    list.map(w => (w.id === id ? { ...w, ...patch } : w));
  write(W_KEY(), apply(read<Withdrawal>(W_KEY())));
  write(
    W_ADMIN_KEY,
    apply(read<Withdrawal & { account: string }>(W_ADMIN_KEY))
  );
  window.dispatchEvent(new Event("indy-wallet"));
  window.dispatchEvent(new Event("indy-orders"));
}