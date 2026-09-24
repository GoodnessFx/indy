import { useState, useEffect } from 'react';
import { ArrowLeftRight, RefreshCw, WifiOff } from 'lucide-react';

// Currency and crypto converter (EUR, USD, GBP, BTC).
//
// Reuses the same live FX feed already wired into withdrawals (Frankfurter,
// the ECB-backed API) and adds a single crypto price source (CoinGecko) for
// BTC, which the FX feed does not carry. All pairs are derived from one USD
// price base so there is no second, disconnected rate feed.
//
// The result is always labelled an estimate unless a rate is locked at
// withdrawal time.

const CUR: { code: string; label: string }[] = [
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'BTC', label: 'Bitcoin' },
];

const FALLBACK_EUR_USD = 1.0842;
const FALLBACK_GBP_USD = 1.2748;
const FALLBACK_BTC_USD = 67240;

export default function CurrencyCalculator() {
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState('');
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('EUR');
  const [to, setTo] = useState('USD');
  // USD value of one unit of each currency.
  const [toUSD, setToUSD] = useState<Record<string, number>>({
    EUR: 1 / FALLBACK_EUR_USD,
    USD: 1,
    GBP: 1 / FALLBACK_GBP_USD,
    BTC: 1 / FALLBACK_BTC_USD,
  });

  const fetchRates = async () => {
    setLoading(true);
    let eurUsd = FALLBACK_EUR_USD;
    let gbpUsd = FALLBACK_GBP_USD;
    let btcUsd = FALLBACK_BTC_USD;
    let ok = false;

    try {
      const fx = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD,GBP');
      if (fx.ok) {
        const data = await fx.json();
        if (typeof data?.rates?.USD === 'number') {
          const eurPerGbp = data.rates.GBP;
          eurUsd = data.rates.USD;
          gbpUsd = eurUsd / eurPerGbp;
          ok = true;
        }
      }
    } catch { /* fall back */ }

    try {
      const cg = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      if (cg.ok) {
        const data = await cg.json();
        if (typeof data?.bitcoin?.usd === 'number') {
          btcUsd = data.bitcoin.usd;
          ok = true;
        }
      }
    } catch { /* fall back */ }

    if (ok) {
      setToUSD({ EUR: 1 / eurUsd, USD: 1, GBP: 1 / gbpUsd, BTC: 1 / btcUsd });
    }
    setOffline(!ok);
    setLoading(false);
    setUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  useEffect(() => { fetchRates(); }, []);

  const n = parseFloat(amount.replace(/,/g, '')) || 0;
  const converted = n * toUSD[from] / toUSD[to];

  const fmt = (v: number) => v.toLocaleString(undefined, {
    minimumFractionDigits: to === 'BTC' ? 6 : 2,
    maximumFractionDigits: to === 'BTC' ? 8 : 2,
  });
return (
    <div className="rounded-2xl border border-black/8 bg-white p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2F6BFF]/12 flex items-center justify-center">
            <ArrowLeftRight size={16} className="text-[#2F6BFF]" />
          </div>
          <h3 className="font-display font-700 text-base text-[#0A0B0D]">Currency &amp; crypto calculator</h3>
        </div>
        <button
          onClick={fetchRates}
          className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center text-black/40 hover:text-black hover:bg-black/10 transition-colors"
          aria-label="Refresh rate"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-center mb-5">
        <div>
          <label className="block text-xs text-black/40 mb-1.5">From</label>
          <div className="flex w-full bg-black/5 border border-black/10 rounded-xl overflow-hidden">
            <div className="flex-1">
              <input
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                inputMode="decimal"
                className="w-full px-3 py-3 bg-transparent text-[#0A0B0D] text-lg font-mono focus:outline-none"
                placeholder="0.00"
                style={{ minWidth: 0 }}
              />
            </div>
            <select
              value={from}
              onChange={e => { if (e.target.value !== to) setFrom(e.target.value); }}
              aria-label="From currency"
              className="bg-black/5 border-l border-black/10 pl-2 pr-2 py-3 text-sm font-semibold text-[#0A0B0D] outline-none cursor-pointer"
            >
              {CUR.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => { const t = from; setFrom(to); setTo(t); }}
          className="w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-[#2F6BFF] hover:bg-[#2F6BFF]/10 transition-colors mx-auto"
          aria-label="Swap direction"
        >
          <ArrowLeftRight size={16} />
        </button>

        <div>
          <label className="block text-xs text-black/40 mb-1.5">To</label>
          <div className="flex w-full bg-white border border-[#2F6BFF]/25 rounded-xl">
            <div className="flex-1 bg-white overflow-hidden">
              <div className="w-full px-3 py-3 text-[#2F6BFF] text-lg font-mono font-600 truncate">
                {fmt(converted)}
              </div>
            </div>
            <select
              value={to}
              onChange={e => { if (e.target.value !== from) setTo(e.target.value); }}
              aria-label="To currency"
              className="bg-black/5 border-l border-[#2F6BFF]/20 pl-2 pr-2 py-3 text-sm font-semibold text-[#0A0B0D] outline-none cursor-pointer"
            >
              {CUR.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {offline ? (
          <span className="flex items-center gap-1.5 text-[#F59E0B]">
            <WifiOff size={12} /> Offline, showing last known rates
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-black/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
            Live rates, updated {updated || 'just now'}
          </span>
        )}
        <span className="font-mono text-black/60">1 {from} = {fmt(toUSD[from] / toUSD[to])} {to}</span>
        <span className="text-black/25">Estimate, rate locks at withdrawal time</span>
      </div>
    </div>
  );
}