// Saved payout methods, shared between Settings (add via scan or manual entry)
// and the Withdraw flow (destination step), so a card added once in Settings is
// selectable later without rescanning. Persisted in localStorage for the demo.
//
// No real card numbers are ever stored. The scan flow uses a test PAN and only
// the last four digits are kept, matching the processor boundary in the spec.

export interface PayoutMethod {
  id: string;
  label: string;
  last4: string;
  type: 'bank' | 'card';
  currency: string;
  isDefault: boolean;
}

const KEY = 'indy_payout_methods';

// A test PAN only. Never a real card number.
export const TEST_PAN = '4242 4242 4242 4242';

const DEFAULT_METHODS: PayoutMethod[] = [
  { id: 'barclays', label: 'Barclays Business', last4: '4521', type: 'bank', currency: 'GBP', isDefault: true },
  { id: 'revolut', label: 'Revolut Debit', last4: '8834', type: 'card', currency: 'EUR', isDefault: false },
];

export function getPayoutMethods(): PayoutMethod[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_METHODS;
    const stored = JSON.parse(raw) as PayoutMethod[];
    if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_METHODS;
    // Merge defaults with any user added methods, avoiding duplicate ids.
    const ids = new Set(stored.map(m => m.id));
    return [...stored, ...DEFAULT_METHODS.filter(m => !ids.has(m.id))];
  } catch {
    return DEFAULT_METHODS;
  }
}

export function getSavedCards(): PayoutMethod[] {
  return getPayoutMethods().filter(m => m.type === 'card');
}

export function addPayoutMethod(method: Omit<PayoutMethod, 'id'>): PayoutMethod {
  const all = getPayoutMethods();
  const id = `card-${method.last4}-${Date.now()}`;
  const next: PayoutMethod = { ...method, id };
  try {
    localStorage.setItem(KEY, JSON.stringify([next, ...all]));
  } catch { /* storage unavailable, keep in-memory only */ }
  return next;
}

export function removePayoutMethod(id: string): void {
  const all = getPayoutMethods().filter(m => m.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}