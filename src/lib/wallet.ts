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
 * committed to paid investments, plus/minus any admin-recorded balance
 * adjustment. Each adjustment requires a reason and is written to the audit
 * trail — there is no silent edit of a money field.
 */
export function accountBalance(): number {
  const funded = myDeposits().reduce((sum, d) => sum + d.amount, 0);
  const spent = myOrders()
    .filter(o => o.status === "active")
    .reduce((sum, o) => sum + o.amount, 0);
  const adjustments = (localUserRecord(account()).balanceAdjustments ?? [])
    .reduce((sum, a) => sum + a.amount, 0);
  return Math.max(0, Math.round((funded - spent + adjustments) * 100) / 100);
}