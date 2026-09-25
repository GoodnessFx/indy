// Transaction fee engine.
//
// One place that turns a transaction amount into a professional, itemised
// charge sheet. Every client-facing surface (invest, withdraw, deposit review)
// reads from here, so the same numbers appear everywhere and can never drift.
//
// Worked example, a $100 order:
//   Service fee 8%                  $8.00
//   Inspection and verification     $5.00
//   Security and custody 2%         $2.00
//   Network and settlement          $1.20
//   Fee subtotal                   $16.20
//   Tax at 20%                      $3.24
//   Total fees                     $19.44  (about $20 on a $100 order)
//   Total charged                 $119.44

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

interface Schedule {
  service: { rate: number; min: number };
  inspection: number;
  inspectionLabel: string;
  inspectionDetail: string;
  security: { rate: number; min: number };
  network: number;
  networkDetail: string;
  taxRate: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

const SCHEDULES: Record<FeeKind, Schedule> = {
  nft: {
    service: { rate: 0.08, min: 1.5 },
    inspection: 5,
    inspectionLabel: 'Provenance inspection',
    inspectionDetail: 'Contract, creator and trait check before settlement',
    security: { rate: 0.02, min: 0.5 },
    network: 1.2,
    networkDetail: 'Ethereum settlement and wallet relay',
    taxRate: 0.2,
  },
  stock: {
    service: { rate: 0.08, min: 1.5 },
    inspection: 2.5,
    inspectionLabel: 'Order and market check',
    inspectionDetail: 'Price band, liquidity and settlement venue review',
    security: { rate: 0.02, min: 0.5 },
    network: 0.8,
    networkDetail: 'Clearing and settlement fee',
    taxRate: 0.2,
  },
  vehicle: {
    service: { rate: 0.08, min: 2 },
    inspection: 15,
    inspectionLabel: 'Physical asset inspection',
    inspectionDetail: 'Condition report, title check and insurance verification',
    security: { rate: 0.025, min: 1 },
    network: 1.5,
    networkDetail: 'Custody and registry filing',
    taxRate: 0.2,
  },
  investment: {
    service: { rate: 0.08, min: 2 },
    inspection: 10,
    inspectionLabel: 'Deal and counterparty review',
    inspectionDetail: 'Structure, counterparty and documentation review',
    security: { rate: 0.02, min: 1 },
    network: 1.5,
    networkDetail: 'Escrow and settlement',
    taxRate: 0.2,
  },
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
  { label: 'Service fee', value: '8% of order value, minimum $1.50' },
  { label: 'Inspection and verification', value: '$2.50 to $15 depending on the asset class' },
  { label: 'Security and custody', value: '2% to 2.5% of order value' },
  { label: 'Network and settlement', value: '$0.80 to $1.50 per transaction' },
  { label: 'Tax', value: '20% of the fee subtotal, shown as VAT or GST on your statement' },
];

/** Builds the itemised charge sheet for a transaction. */
export function feeBreakdown(amount: number, kind: FeeKind, currency = 'USD'): FeeBreakdown {
  const s = SCHEDULES[kind];
  const base = Math.max(0, amount || 0);

  const serviceAmount = base > 0 ? Math.max(s.service.min, base * s.service.rate) : 0;
  const securityAmount = base > 0 ? Math.max(s.security.min, base * s.security.rate) : 0;
  const inspectionAmount = base > 0 ? s.inspection : 0;
  const networkAmount = base > 0 ? s.network : 0;

  const lines: FeeLine[] = [
    {
      key: 'service',
      label: 'Service fee',
      detail: s.service.rate > 0 ? `${(s.service.rate * 100).toFixed(1)}% of order value` : 'No platform fee',
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
      detail: `${(s.security.rate * 100).toFixed(1)}% of order value`,
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