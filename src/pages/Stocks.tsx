import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Rocket } from 'lucide-react';
import { mockStocks, spaceStocks } from '../data/mock';

const sectors = ['All', 'Tech', 'Space', 'EV', 'AI'];

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80, h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const positive = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={positive ? '#22C55E' : '#EF4444'} strokeWidth="1.5" />
    </svg>
  );
}

export default function Stocks() {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');

  const spaceItems = mockStocks.filter(s => spaceStocks.includes(s.id));
  const filtered = mockStocks.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
    if (sector !== 'All' && s.sector !== sector) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0B0D] pt-20">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
          <p className="font-mono text-xs text-[#22C55E] tracking-widest uppercase mb-3">Markets</p>
          <h1 className="font-display font-800 text-4xl lg:text-5xl text-white mb-3">Stock Markets</h1>
          <p className="text-white/40 text-sm">Global equities, ETFs, and thematic baskets. Real-time pricing.</p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
        {/* Space Economy shelf */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <Rocket size={15} className="text-[#2F6BFF]" />
            <h2 className="font-display font-600 text-base text-white">Space & New Economy</h2>
            <span className="text-xs text-white/30 ml-1">Pinned</span>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {spaceItems.map(stock => (
              <Link
                key={stock.id}
                to={`/stocks/${stock.id}`}
                className="shrink-0 glass rounded-2xl border border-white/8 p-5 hover:border-[#2F6BFF]/30 transition-all group w-52"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono font-600 text-sm text-white">{stock.id}</p>
                    <p className="text-xs text-white/30 mt-0.5 truncate max-w-[110px]">{stock.name}</p>
                  </div>
                  <span className="text-[10px] chip-accent px-2 py-0.5 rounded-full font-mono">{stock.sector}</span>
                </div>
                <div className="mb-3">
                  <Sparkline data={stock.sparkline} />
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-mono font-700 text-lg text-white">${stock.price}</span>
                  <span className={`font-mono text-xs font-600 flex items-center gap-1 ${stock.changePct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {stock.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {stock.changePct >= 0 ? '+' : ''}{stock.changePct}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 mb-6 flex-col sm:flex-row">
          <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 border border-white/8 flex-1">
            <Search size={15} className="text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ticker or company name..."
              className="bg-transparent text-sm text-white placeholder-white/25 outline-none flex-1"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {sectors.map(s => (
              <button key={s} onClick={() => setSector(s)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  sector === s ? 'bg-[#22C55E] text-[#0A0B0D]' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-6 py-4 border-b border-white/8 bg-white/2">
            {['Ticker / Name', 'Price', 'Change', 'Volume', '7D'].map(h => (
              <span key={h} className="font-mono text-[10px] text-white/30 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Search size={28} className="text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/40">No stocks match your search</p>
            </div>
          ) : (
            filtered.map(stock => (
              <Link
                key={stock.id}
                to={`/stocks/${stock.id}`}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-6 py-4 border-b border-white/5 hover:bg-white/3 transition-colors items-center group"
              >
                <div>
                  <span className="font-mono font-700 text-sm text-white group-hover:text-[#22C55E] transition-colors">{stock.id}</span>
                  <p className="text-xs text-white/30 mt-0.5 truncate max-w-[180px]">{stock.name}</p>
                </div>
                <span className="font-mono text-sm text-white">${stock.price}</span>
                <div className={`flex items-center gap-1 ${stock.changePct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {stock.changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span className="font-mono text-sm">{stock.changePct >= 0 ? '+' : ''}{stock.changePct}%</span>
                </div>
                <span className="font-mono text-sm text-white/40">{stock.volume}</span>
                <Sparkline data={stock.sparkline} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
