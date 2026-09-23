import { TrendingUp, TrendingDown } from 'lucide-react';
import { tickerItems } from '../data/mock';

export default function TickerStrip() {
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="bg-[#060810] border-y border-white/5 py-3 overflow-hidden relative">
      <div className="flex ticker-track" style={{ width: 'max-content' }}>
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-6 shrink-0 border-r border-white/5 last:border-r-0">
            <span className="font-mono text-[11px] font-500 text-white/50 tracking-wider">{item.symbol}</span>
            <span className="font-mono text-[12px] font-600 text-white tabular-nums">{item.price}</span>
            <span className={`flex items-center gap-0.5 font-mono text-[11px] font-500 ${item.positive ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {item.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {item.change}
            </span>
          </div>
        ))}
      </div>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#060810] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#060810] to-transparent pointer-events-none" />
    </div>
  );
}
