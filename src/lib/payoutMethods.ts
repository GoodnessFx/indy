// Saved payout methods, shared between Settings (add via scan or manual entry)
// and the Withdraw flow (destination step), so a card added once in Settings is
// selectable later without rescanning.
//
// A client only ever sees what they added themselves. Earlier builds seeded
// demo accounts (a fake bank + card) and a fake "scanned card" with no number
// on it; both are filtered out on read so nobody has to remove a placeholder by
// hand. Nothing here invents digits: a card either carries a number the scanner
// actually read, or it carries the captures of the card for the admin to
// complete.

export interface PayoutMethod {
  id: string;
  label: string;
  last4: string;
  type: 'bank' | 'card';
  currency: string;
  isDefault: boolean;
  /** Presentation details captured with the scan / manual entry. */
  brand?: string;
  cardholder?: string;
  expiry?: string;
  /** Masked number read from the card, e.g. '**** **** **** 1234'. */
  number?: string;
  /** Front (and back) captures of the card that was scanned. */
  images?: string[];
  /** How the card got here. */
  source?: 'scan' | 'manual' | 'image';
  addedAt?: string;
}

const KEY = 'indy_payout_methods';
/** Seeded by earlier builds for demonstration only. */
const DEMO_IDS = ['barclays', 'revolut'];

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

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
}

/**
 * A method is shown only when it is real: added by this client, carrying either
 * digits that were actually read or the captures of the card that was scanned.
 */
function isOwnMethod(method: PayoutMethod): boolean {
  if (!method || !method.id) return false;
  if (DEMO_IDS.includes(method.id)) return false;
  // The old scanner stamped "Scanned card" with a test number and no capture.
  if (
    method.last4 === '4242' &&
    method.label === 'Scanned card' &&
    !method.number &&
    !(method.images ?? []).length
  ) {
    return false;
  }
  return Boolean(method.last4) || (method.images ?? []).length > 0;
}

let cleaned = false;

export function getPayoutMethods(): PayoutMethod[] {
  const all = read<PayoutMethod>(KEY);
  const stored = all.filter(isOwnMethod);
  if (!cleaned) {
    cleaned = true;
    if (all.length !== stored.length) save(KEY, stored);
  }
  return stored;
}

export function getSavedCards(): PayoutMethod[] {
  return getPayoutMethods().filter(m => m.type === 'card');
}

export function addPayoutMethod(method: Omit<PayoutMethod, 'id'>): PayoutMethod {
  const next: PayoutMethod = {
    ...method,
    id: `card-${(method.last4 || 'scan').slice(-4)}-${Date.now()}`,
    addedAt: method.addedAt ?? new Date().toISOString(),
  };
  save(KEY, [...read<PayoutMethod>(KEY).filter(isOwnMethod), next]);
  return next;
}

export function updatePayoutMethod(id: string, patch: Partial<PayoutMethod>): PayoutMethod | null {
  const stored = read<PayoutMethod>(KEY).filter(isOwnMethod);
  const index = stored.findIndex(m => m.id === id);
  if (index < 0) return null;
  stored[index] = { ...stored[index], ...patch };
  save(KEY, stored);
  return stored[index];
}

export function removePayoutMethod(id: string): void {
  save(KEY, read<PayoutMethod>(KEY).filter(m => m.id !== id));
}
