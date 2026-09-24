import { useState, useEffect } from 'react';
import { ArrowLeftRight, RefreshCw, WifiOff } from 'lucide-react';
import { fetchLiveRates, convert, formatStamp, FALLBACK_TO_USD, SUPPORTED_CURRENCIES, type Rates } from '../lib/rates';

// Currency and crypto converter (EUR, USD, GBP, BTC).
//
// Rates come from the single shared fetcher in src/lib/rates.ts, the same feed
// the withdrawal estimate uses, so this widget and the rest of the app cannot
// drift apart. The stamp shows HH:MM:SS so it is visibly live, not hardcoded.
//
// Pass `compact` for the dashboard widget; the standalone homepage section uses
// the default full size.

export default function CurrencyCalculator({ compact = false }: { compact?: boolean }) {
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('EUR');
  const [to, setTo] = useState('USD');

  const load = async () => {
    setLoading(true);
    setRates(await fetchLiveRates());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toUSD = rates?.toUSD ?? FALLBACK_TO_USD;
  const n = parseFloat(amount.replace(/,/g, '')) || 0;
  const converted = convert(n, from, to, toUSD);
  const unitRate = convert(1, from, to, toUSD);

  const fmt = (v: number) => v.toLocaleString(undefined, {
    minimumFractionDigits: to === 'BTC' ? 6 : 2,
    maximumFractionDigits: to === 'BTC' ? 8 : 2,
  });

  return (
    <div className={`rounded-2xl border border-black/8 bg-white ${compact ? 'p-5' : 'p-6 lg:p-8'}`}>
      <div className={`flex items-center justify-between ${compact ? 'mb-4' : 'mb-6'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2F6BFF]/12 flex items-center justify-center">
            <ArrowLeftRight size={16} className="text-[#2F6BFF]" />
          </div>
          <h3 className={`font-display font-700 text-[#0A0B0D] ${compact ? 'text-sm' : 'text-base'}`}>
            Currency &amp; crypto calculator
          </h3>
        </div>
        <button
          onClick={load}
          className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center text-black/40 hover:text-black hover:bg-black/10 transition-colors"
          aria-label="Refresh rate"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className={`grid gap-3 items-center ${compact ? 'grid-cols-1' : 'sm:grid-cols-[1fr_auto_1fr]'} mb-5`}>
        <div>
          <label className="block text-xs text-black/40 mb-1.5">From</label>
          <div className="flex w-full bg-black/5 border border-black/10 rounded-xl overflow-hidden">
            <input
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
              className={`flex-1 px-3 py-3 bg-transparent text-[#0A0B0D] font-mono focus:outline-none ${compact ? 'text-base' : 'text-lg'}`}
              placeholder="0.00"
              style={{ minWidth: 0 }}
            />
            <select
              value={from}
              onChange={e => { if (e.target.value !== to) setFrom(e.target.value); }}
              aria-label="From currency"
              className="bg-black/5 border-l border-black/10 px-2 py-3 text-sm font-semibold text-[#0A0B0D] outline-none cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => { const t = from; setFrom(to); setTo(t); }}
          className={`w-10 h-10 rounded-full bg-black/5 border border-black/10 flex items-center justify-center text-[#2F6BFF] hover:bg-[#2F6BFF]/10 transition-colors ${compact ? 'mx-0' : 'mx-auto'}`}
          aria-label="Swap direction"
        >
          <ArrowLeftRight size={16} />
        </button>

        <div>
          <label className="block text-xs text-black/40 mb-1.5">To</label>
          <div className="flex w-full bg-white border border-[#2F6BFF]/25 rounded-xl">
            <div className={`flex-1 px-3 py-3 text-[#2F6BFF] font-mono font-600 truncate ${compact ? 'text-base' : 'text-lg'}`}>
              {fmt(converted)}
            </div>
            <select
              value={to}
              onChange={e => { if (e.target.value !== from) setTo(e.target.value); }}
              aria-label="To currency"
              className="bg-black/5 border-l border-[#2F6BFF]/20 px-2 py-3 text-sm font-semibold text-[#0A0B0D] outline-none cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {rates?.offline ? (
          <span className="flex items-center gap-1.5 text-[#F59E0B]">
            <WifiOff size={12} /> Offline, showing last known rates
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-black/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
            Live rates as of {rates ? formatStamp(rates.updated) : 'just now'}
          </span>
        )}
        <span className="font-mono text-black/60">1 {from} = {fmt(unitRate)} {to}</span>
        <span className="text-black/25">Estimate, rate locks at withdrawal time</span>
      </div>
    </div>
  );
}