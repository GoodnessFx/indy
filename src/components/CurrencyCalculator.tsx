import { useMemo, useState } from "react";
import { ArrowRightLeft, RefreshCw, WifiOff } from "lucide-react";
import { convert, formatStamp, SUPPORTED_CURRENCIES } from "../lib/rates";
import { useLiveRates } from "../lib/useLiveRates";

export default function CurrencyCalculator({ compact = false }: { compact?: boolean }) {
  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const { toUSD, offline, updated, loading, refresh } = useLiveRates();
  const amt = parseFloat(amount) || 0;
  const result = useMemo(() => convert(amt, from, to, toUSD), [amt, from, to, toUSD]);
  const formattedResult = to === "BTC" ? result.toFixed(6) : result.toFixed(2);
  const rate = useMemo(() => convert(1, from, to, toUSD), [from, to, toUSD]);
  const currencies = [...SUPPORTED_CURRENCIES];
  const stamp = formatStamp(updated);

  return (
    <div className={`glass rounded-2xl border border-black/8 ${compact ? "p-4" : "p-6 md:p-8"}`}>
      <div className={`flex ${compact ? "flex-col items-start gap-2 mb-4" : "items-center justify-between mb-6 flex-col sm:flex-row gap-3"}`}>
        <div>
          {!compact && <h3 className="font-display font-600 text-xl text-[#0A0B0D]">Currency & Crypto Calculator</h3>}
          <div className="flex items-center gap-2 text-xs font-mono">
            {offline ? (
              <>
                <WifiOff size={12} className="text-[#D97706]" />
                <span className="text-[#D97706]">Offline fallback</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
                <span className="text-black/45">Rates as of {stamp}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 text-xs text-black/40 hover:text-black/70 transition-colors"
          aria-label="Refresh rates"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className={`flex ${compact ? "flex-col gap-3" : "flex-col md:flex-row items-center gap-4"}`}>
        <div className="flex-1 w-full bg-white border border-black/10 rounded-xl p-3 flex items-center gap-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent font-mono font-600 text-lg text-[#0A0B0D] outline-none"
          />
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-black/5 rounded-lg px-2 py-1 text-sm font-medium outline-none"
          >
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className={`flex justify-center ${compact ? "" : "px-2"}`}>
          <button
            onClick={() => { setFrom(to); setTo(from); }}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
          >
            <ArrowRightLeft size={14} className="text-black/40" />
          </button>
        </div>

        <div className="flex-1 w-full bg-black/3 border border-black/8 rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1 font-mono font-600 text-lg text-[#0A0B0D] truncate">
            {formattedResult}
          </div>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-white rounded-lg border border-black/10 px-2 py-1 text-sm font-medium outline-none"
          >
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className={`mt-4 flex ${compact ? "flex-col items-start gap-1.5" : "items-center justify-between gap-3 flex-col sm:flex-row"} text-xs`}>
        <span className="font-mono text-black/45">
          1 {from} = {to === "BTC" ? rate.toFixed(6) : rate.toFixed(4)} {to}
        </span>
        <span className="text-black/30">
          Uses the same shared live feed as the withdrawal flow.
        </span>
      </div>
    </div>
  );
}
