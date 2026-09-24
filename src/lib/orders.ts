// Client investment orders. A signed-in client picks an asset, chooses an
// amount, and submits. The order lands in the admin notice feed and in the
// client's own portfolio as pending, then flips to active once the client
// confirms payment. Persisted per account in localStorage until the backend
// order table ships; the function names stay the same when it does.

import { getStoredGoogleUser } from "./googleAuth";

export type OrderKind = "nft" | "stock" | "investment" | "vehicle";
export type OrderStatus = "pending" | "active";

export interface InvestmentOrder {
  id: string;
  assetId: string;
  assetName: string;
  kind: OrderKind;
  amount: number;
  currency: string;
  status: OrderStatus;
  paidAt: string | null;
  createdAt: string;
  account: string;
}

function orderAccount(): string {
  const profile = getStoredGoogleUser();
  return profile?.email ?? profile?.sub ?? "guest";
}

function readOrders(key: string): InvestmentOrder[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InvestmentOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(key: string, orders: InvestmentOrder[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(orders));
  } catch { /* storage unavailable, keep in-memory only */ }
}

const mineKey = () => `indy_${orderAccount()}_orders`;
export const adminFeedKey = "indy_admin_order_feed";

export function myOrders(): InvestmentOrder[] {
  return readOrders(mineKey());
}

export function adminOrderFeed(): InvestmentOrder[] {
  return readOrders(adminFeedKey);
}

/** Client submits an investment. Visible to the client and to admin at once. */
export function placeOrder(input: {
  assetId: string;
  assetName: string;
  kind: OrderKind;
  amount: number;
  currency?: string;
}): InvestmentOrder {
  const order: InvestmentOrder = {
    id: `ord-${Date.now().toString(36)}`,
    assetId: input.assetId,
    assetName: input.assetName,
    kind: input.kind,
    amount: input.amount,
    currency: input.currency ?? "USD",
    status: "pending",
    paidAt: null,
    createdAt: new Date().toISOString(),
    account: orderAccount(),
  };
  writeOrders(mineKey(), [order, ...readOrders(mineKey())]);
  writeOrders(adminFeedKey, [order, ...readOrders(adminFeedKey)]);
  window.dispatchEvent(new Event("indy-orders"));
  return order;
}

/** Client confirms payment. The holding activates in their portfolio. */
export function confirmOrderPaid(id: string): void {
  const bump = (list: InvestmentOrder[]) =>
    list.map(o => (o.id === id ? { ...o, status: "active" as OrderStatus, paidAt: new Date().toISOString() } : o));
  writeOrders(mineKey(), bump(readOrders(mineKey())));
  writeOrders(adminFeedKey, bump(readOrders(adminFeedKey)));
  window.dispatchEvent(new Event("indy-orders"));
}

export function orderCount(): number {
  return myOrders().filter(o => o.status === "active").length;
}
