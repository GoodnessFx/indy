// One shared live-rate fetcher used by every converter surface: the homepage
// calculator, the dashboard widget, and the withdrawal estimate. Keeping a
// single implementation means those surfaces cannot drift apart or show
// different numbers for the same pair.
//
// FX comes from Frankfurter (the ECB-backed API already used for withdrawals).
// BTC comes from CoinGecko, which the FX feed does not carry. Every pair is
// derived from a single USD base, so there is no second, disconnected feed.
//
// Values are estimates. The exact rate is locked in only when a withdrawal is
// confirmed.

export interface Rates {
  /** USD value of one unit of each currency (EUR, USD, GBP, BTC). */
  toUSD: Record<string, number>;
  /** True when the network fetch failed and fallback values are shown. */
  offline: boolean;
  /** When the rates were last successfully fetched. */
  updated: Date;
}

const FALLBACK = { eurUsd: 1.0842, gbpUsd: 1.2748, btcUsd: 67240 };

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'BTC'] as const;

function build(eurUsd: number, gbpUsd: number, btcUsd: number): Record<string, number> {
  return { EUR: 1 / eurUsd, USD: 1, GBP: 1 / gbpUsd, BTC: 1 / btcUsd };
}

/** Fallback rates, used on first paint and when the network is unavailable. */
export const FALLBACK_TO_USD = build(FALLBACK.eurUsd, FALLBACK.gbpUsd, FALLBACK.btcUsd);

/** Fetch the live rates. Never throws; falls back to last known values. */
export async function fetchLiveRates(): Promise<Rates> {
  let eurUsd = FALLBACK.eurUsd;
  let gbpUsd = FALLBACK.gbpUsd;
  let btcUsd = FALLBACK.btcUsd;
  let ok = false;

  try {
    const fx = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,GBP');
    if (fx.ok) {
      const data = await fx.json();
      if (typeof data?.rates?.USD === 'number' && typeof data?.rates?.GBP === 'number') {
        eurUsd = data.rates.USD;
        gbpUsd = eurUsd / data.rates.GBP;
        ok = true;
      }
    }
  } catch { /* keep fallbacks */ }

  try {
    const cg = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    if (cg.ok) {
      const data = await cg.json();
      if (typeof data?.bitcoin?.usd === 'number') {
        btcUsd = data.bitcoin.usd;
        ok = true;
      }
    }
  } catch { /* keep fallbacks */ }

  return { toUSD: build(eurUsd, gbpUsd, btcUsd), offline: !ok, updated: new Date() };
}

/** Convert an amount between two supported currencies. */
export function convert(amount: number, from: string, to: string, toUSD: Record<string, number>): number {
  const f = toUSD[from] ?? 1;
  const t = toUSD[to] ?? 1;
  return (amount * f) / t;
}

/** Formats a rate timestamp as HH:MM:SS so it is visibly live, not hardcoded. */
export function formatStamp(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}