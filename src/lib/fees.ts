// Transaction fee engine.
//
// One place that turns a transaction amount into a professional, itemised
// charge sheet. Every client-facing surface (invest, withdraw, deposit review)
// reads from here, so the same numbers appear everywhere and cannot drift.
//
// Headline rule: 19.99% of the transaction value, minimum $1.99.
// Worked example, a $100 order:
//   Service fee                     $8.00
//   Inspection and verification     $5.00
//   Security and custody            $2.00
//   Network and settlement          $1.00
//   Tax (VAT / GST)                 $3.99
//   Total charges                  $19.99
//   Total charged                 $119.99
//
// Withdrawals use their own lighter payout schedule, since they are a movement
// of the client's own funds rather than a purchase.

export type FeeKind = 'nft' | 'stock' | 'vehicle' | 'investment' | 'withdrawal' | 'deposit';

export interface FeeLine {
  key: string;
  label: string;
  detail: string;
  amount: number;
}

export interface FeeBreakdown {
  amount: number;
  currency: string;
  lines: FeeLine[];
  subtotal: number;
  taxRate: number;
  tax: number;
  totalFees: number;
  totalCharged: number;
}

/** Headline charge on purchases: 19.99% of order value, minimum $1.99. */
export const CHARGE_RATE = 0.1999;
export const CHARGE_MINIMUM = 1.99;

const round = (n: number) => Math.round(n * 100) / 100;

// Allocation of the headline charge, professional invoice style.
const ALLOCATION = {
  service: 0.4,
  inspection: 0.25,
  security: 0.1,
  network: 0.05,
};

interface Schedule {
  /** When set, the headline percentage drives the total and lines are allocated. */
  targetRate?: number;
  service: { rate: number; min: number };
  inspection: number;
  inspectionLabel: string;
  inspectionDetail: string;
  security: { rate: number; min: number };
  network: number;
  networkDetail: string;
  taxRate: number;
}

const PURCHASE = (inspectionLabel: string, inspectionDetail: string): Schedule => ({
  targetRate: CHARGE_RATE,
  service: { rate: 0, min: 0 },
  inspection: 0,
  inspectionLabel,
  inspectionDetail,
  security: { rate: 0, min: 0 },
  network: 0,
  networkDetail: 'Settlement rail and blockchain relay',
  taxRate: 0,
});

const SCHEDULES: Record<FeeKind, Schedule> = {
  nft: PURCHASE('Provenance inspection', 'Contract, creator, trait and authenticity check'),
  stock: PURCHASE('Order and market check', 'Price band, liquidity and settlement venue review'),
  vehicle: PURCHASE('Physical asset inspection', 'Condition report, title check and insurance verification'),
  investment: PURCHASE('Deal and counterparty review', 'Structure, counterparty and documentation review'),
  withdrawal: {
    service: { rate: 0.004, min: 0.5 },
    inspection: 0,
    inspectionLabel: 'Compliance screening',
    inspectionDetail: 'Name, sanctions and destination screening',
    security: { rate: 0.001, min: 0.2 },
    network: 0.9,
    networkDetail: 'Payout rail and FX settlement',
    taxRate: 0,
  },
  deposit: {
    service: { rate: 0, min: 0 },
    inspection: 0,
    inspectionLabel: 'Source of funds check',
    inspectionDetail: 'Required above the reporting threshold',
    security: { rate: 0.002, min: 0 },
    network: 0,
    networkDetail: 'Network fee paid to the chain, not to us',
    taxRate: 0,
  },
};

export const FEE_SCHEDULE_TABLE = [
  { label: 'Total transaction charge', value: '19.99% of the order value, minimum $1.99' },
  { label: 'Service fee', value: 'Largest share of the charge, capped and disclosed up front' },
  { label: 'Inspection and verification', value: 'Provenance, condition or counterparty check by asset class' },
  { label: 'Security and custody', value: 'Segregated custody, insurance and settlement protection' },
  { label: 'Network and settlement', value: 'Rail and chain costs to move the asset or the money' },
  { label: 'Tax', value: 'Shown as VAT or GST on your statement and receipt' },
];

/** Builds the itemised charge sheet for a transaction. */
export function feeBreakdown(amount: number, kind: FeeKind, currency = 'USD'): FeeBreakdown {
  const s = SCHEDULES[kind];
  const base = Math.max(0, amount || 0);

  // Purchases: the headline 19.99% charge drives the total, and the invoice
  // lines are allocations of it, with tax as the balancing line so the sheet
  // always sums exactly to the headline charge.
  if (s.targetRate) {
    const totalFees = base > 0 ? round(Math.max(CHARGE_MINIMUM, base * s.targetRate)) : 0;
    const serviceAmount = round(totalFees * ALLOCATION.service);
    const inspectionAmount = round(totalFees * ALLOCATION.inspection);
    const securityAmount = round(totalFees * ALLOCATION.security);
    const networkAmount = round(totalFees * ALLOCATION.network);
    const subtotal = round(serviceAmount + inspectionAmount + securityAmount + networkAmount);
    const tax = round(totalFees - subtotal);
    const effectiveTaxRate = subtotal > 0 ? tax / subtotal : 0;

    const lines: FeeLine[] = [
      {
        key: 'service',
        label: 'Service fee',
        detail: `${(CHARGE_RATE * 100).toFixed(2)}% total charge, service portion`,
        amount: serviceAmount,
      },
      { key: 'inspection', label: s.inspectionLabel, detail: s.inspectionDetail, amount: inspectionAmount },
      {
        key: 'security',
        label: 'Security and custody',
        detail: 'Segregated custody, insurance and settlement protection',
        amount: securityAmount,
      },
      { key: 'network', label: 'Network and settlement', detail: s.networkDetail, amount: networkAmount },
    ];

    return {
      amount: base,
      currency,
      lines,
      subtotal,
      taxRate: effectiveTaxRate,
      tax,
      totalFees,
      totalCharged: round(base + totalFees),
    };
  }

  const serviceAmount = base > 0 ? Math.max(s.service.min, base * s.service.rate) : 0;
  const securityAmount = base > 0 ? Math.max(s.security.min, base * s.security.rate) : 0;
  const inspectionAmount = base > 0 ? s.inspection : 0;
  const networkAmount = base > 0 ? s.network : 0;

  const lines: FeeLine[] = [
    {
      key: 'service',
      label: 'Service fee',
      detail: s.service.rate > 0 ? `${(s.service.rate * 100).toFixed(1)}% of payout value` : 'No platform fee',
      amount: round(serviceAmount),
    },
    {
      key: 'inspection',
      label: s.inspectionLabel,
      detail: s.inspectionDetail,
      amount: round(inspectionAmount),
    },
    {
      key: 'security',
      label: 'Security and custody',
      detail: `${(s.security.rate * 100).toFixed(1)}% of payout value`,
      amount: round(securityAmount),
    },
    {
      key: 'network',
      label: 'Network and settlement',
      detail: s.networkDetail,
      amount: round(networkAmount),
    },
  ].filter(line => line.amount > 0 || kind !== 'deposit');

  const subtotal = round(lines.reduce((sum, l) => sum + l.amount, 0));
  const tax = round(subtotal * s.taxRate);
  const totalFees = round(subtotal + tax);

  return {
    amount: base,
    currency,
    lines,
    subtotal,
    taxRate: s.taxRate,
    tax,
    totalFees,
    totalCharged: round(base + totalFees),
  };
}

export const money = (n: number, currency = 'USD') =>
  `${currency === 'USD' ? '$' : ''}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;