// Saved payout methods, shared between Settings (add via scan or manual entry)
// and the Withdraw flow (destination step), so a card added once in Settings is
// selectable later without rescanning.
//
// Defaults (a sample bank + card) are shown only until a client adds their own
// method, and removing any method persists, so the client only ever sees their
// own saved accounts after they start adding. No real card numbers are stored;
// only the last four digits are kept.

export interface PayoutMethod {
  id: string;
  label: string;
  last4: string;
  type: 'bank' | 'card';
  currency: string;
  isDefault: boolean;
}

const KEY = 'indy_payout_methods';
const REMOVED_KEY = 'indy_payout_removed';
// A test PAN only. Never a real card number.
export const TEST_PAN = '4242 4242 4242 4242';

const DEFAULT_METHODS: PayoutMethod[] = [
  { id: 'barclays', label: 'Barclays Business', last4: '4521', type: 'bank', currency: 'GBP', isDefault: true },
  { id: 'revolut', label: 'Revolut Debit', last4: '8834', type: 'card', currency: 'EUR', isDefault: false },
];

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

export function getPayoutMethods(): PayoutMethod[] {
  const added = read<PayoutMethod>(KEY);
  if (added.length > 0) return added;
  const removed = read<string>(REMOVED_KEY);
  return DEFAULT_METHODS.filter(m => !removed.includes(m.id));
}

export function getSavedCards(): PayoutMethod[] {
  return getPayoutMethods().filter(m => m.type === 'card');
}

export function addPayoutMethod(method: Omit<PayoutMethod, 'id'>): PayoutMethod {
  const next: PayoutMethod = {
    ...method,
    id: `card-${method.last4}-${Date.now()}`,
  };
  save(KEY, [...read<PayoutMethod>(KEY), next]);
  return next;
}

export function removePayoutMethod(id: string): void {
  const added = read<PayoutMethod>(KEY);
  if (added.some(m => m.id === id)) {
    save(KEY, added.filter(m => m.id !== id));
    return;
  }
  // Removing a default is remembered so it stays gone.
  const removed = read<string>(REMOVED_KEY);
  if (!removed.includes(id)) save(REMOVED_KEY, [...removed, id]);
}