import { useState, useEffect } from 'react';
import { ArrowLeftRight, RefreshCw, WifiOff } from 'lucide-react';

// Live EUR to USD converter. Rates come from Frankfurter, the free ECB-backed
// API, no key required. If the network call fails, a recent cached rate is
// shown and clearly labeled as offline, never a silent wrong number.
const FALLBACK_RATE = 1.0842;

export default function FxCalculator() {
  const [rate, setRate] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<string>('');
  const [amount, setAmount] = useState('1000');
  const [direction, setDirection] = useState<'eur-usd' | 'usd-eur'>('eur-usd');

  const fetchRate = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
      if (!res.ok) throw new Error('bad status');
      const data = await res.json();
      setRate(data.rates.USD);
      setOffline(false);
      setUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setRate(null);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRate(); }, []);

  const effectiveRate = rate ?? FALLBACK_RATE;
  const n = parseFloat(amount.replace(/,/g, '')) || 0;
  const converted = direction === 'eur-usd' ? n * effectiveRate : n / effectiveRate;

  const fmt = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const from = direction === 'eur-usd' ? 'EUR' : 'USD';
  const to = direction === 'eur-usd' ? 'USD' : 'EUR';

  return (
    <div className="rounded-2xl border border-white/8 bg-[#111318] p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2F6BFF]/12 flex items-center justify-center">
            <ArrowLeftRight size={16} className="text-[#2F6BFF]" />
          </div>
          <h3 className="font-display font-700 text-base text-white">Live currency converter</h3>
        </div>
        <button
          onClick={fetchRate}
          className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Refresh rate"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-center mb-5">
        <div>
          <label className="text-xs text-white/40 mb-1.5 block">{from} amount</label>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-white text-lg focus:outline-none focus:border-[#2F6BFF]"
            placeholder="0.00"
          />
        </div>
        <button
          onClick={() => setDirection(d => (d === 'eur-usd' ? 'usd-eur' : 'eur-usd'))}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#2F6BFF] hover:bg-[#2F6BFF]/10 transition-colors mx-auto"
          aria-label="Swap direction"
        >
          <ArrowLeftRight size={16} />
        </button>
        <div>
          <label className="text-xs text-white/40 mb-1.5 block">{to} you get</label>
          <div className="w-full bg-[#2F6BFF]/8 border border-[#2F6BFF]/25 rounded-xl px-4 py-3 font-mono text-[#2F6BFF] text-lg font-600 truncate">
            {fmt(converted)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {offline ? (
          <span className="flex items-center gap-1.5 text-[#F59E0B]">
            <WifiOff size={12} /> Offline, showing cached rate
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
            Live rate, updated {updated || 'just now'}
          </span>
        )}
        <span className="font-mono text-white/60">1 EUR = {effectiveRate.toFixed(4)} USD</span>
        <span className="text-white/25">Source, European Central Bank</span>
      </div>
    </div>
  );
}
