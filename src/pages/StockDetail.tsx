import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar } from 'recharts';
import { mockStocks } from '../data/mock';

const chartData = [
  { date: 'Jan', open: 820, close: 835, high: 845, low: 810, volume: 28 },
  { date: 'Feb', open: 835, close: 810, high: 840, low: 800, volume: 32 },
  { date: 'Mar', open: 810, close: 855, high: 860, low: 805, volume: 41 },
  { date: 'Apr', open: 855, close: 845, high: 870, low: 840, volume: 25 },
  { date: 'May', open: 845, close: 870, high: 880, low: 842, volume: 38 },
  { date: 'Jun', open: 870, close: 860, high: 875, low: 855, volume: 29 },
  { date: 'Jul', open: 860, close: 875, high: 885, low: 855, volume: 35 },
];

export default function StockDetail() {
  const { id } = useParams();
  const stock = mockStocks.find(s => s.id === id) || mockStocks[0];
  const [qty, setQty] = useState('5');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [timeRange, setTimeRange] = useState('6M');

  const total = (parseFloat(qty) || 0) * stock.price;

  return (
    <div className="min-h-screen bg-[#0A0B0D] pt-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
        <Link to="/stocks" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={15} /> Back to Stocks
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Left */}
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-8 flex-col sm:flex-row gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-800 text-2xl text-white">{stock.id}</span>
                  <span className="text-xs chip-accent px-2.5 py-1 rounded-full font-mono">{stock.sector}</span>
                </div>
                <p className="text-white/40">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-800 text-4xl text-white">${stock.price.toFixed(2)}</p>
                <div className={`flex items-center gap-1.5 justify-end mt-1 ${stock.changePct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {stock.changePct >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  <span className="font-mono font-600">{stock.changePct >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePct >= 0 ? '+' : ''}{stock.changePct}%)</span>
                  <span className="text-white/30 text-xs">today</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="glass rounded-2xl border border-white/8 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-600 text-base text-white">Price chart</h3>
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                  {['1D', '1W', '1M', '6M', '1Y'].map(r => (
                    <button key={r} onClick={() => setTimeRange(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-600 transition-all ${
                        timeRange === r ? 'bg-[#22C55E] text-[#0A0B0D]' : 'text-white/40 hover:text-white/70'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#F7F7F5' }} />
                  <Bar dataKey="volume" fill="rgba(34,197,94,0.1)" yAxisId="vol" />
                  <Line type="monotone" dataKey="close" stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#22C55E' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Key stats */}
            <div className="glass rounded-2xl border border-white/8 p-6">
              <h3 className="font-display font-600 text-base text-white mb-5">Key statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Market Cap', value: stock.cap },
                  { label: 'Volume (24h)', value: stock.volume },
                  { label: 'P/E Ratio', value: '68.2' },
                  { label: 'Day Range', value: '$850–$880' },
                  { label: '52W High', value: '$974.00' },
                  { label: '52W Low', value: '$612.00' },
                  { label: 'Avg. Volume', value: '38.2M' },
                  { label: 'Beta', value: '1.72' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/3 rounded-xl p-3">
                    <p className="text-[10px] text-white/30 mb-1 font-mono">{stat.label}</p>
                    <p className="font-mono font-600 text-sm text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buy/Sell panel */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="glass rounded-2xl border border-white/8 p-6">
              <div className="flex rounded-xl bg-white/5 p-1 mb-6">
                {(['buy', 'sell'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-display font-600 capitalize transition-all ${
                      side === s
                        ? s === 'buy' ? 'bg-[#22C55E] text-[#0A0B0D]' : 'bg-[#EF4444] text-white'
                        : 'text-white/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-white/40 mb-2">Quantity (shares)</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    min="1"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#22C55E] transition-colors font-mono"
                  />
                </div>
                <div className="bg-white/3 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Market price</span>
                    <span className="font-mono text-white">${stock.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Shares</span>
                    <span className="font-mono text-white">{qty || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40 flex items-center gap-1">
                      Commission <Info size={11} />
                    </span>
                    <span className="font-mono text-white">${(total * 0.001).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/8 pt-2.5">
                    <span className="font-display font-600 text-sm text-white">Total</span>
                    <span className="font-mono font-700 text-lg text-white">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Link to="/signup"
                className={`w-full block text-center py-4 rounded-xl font-display font-600 text-sm transition-all ${
                  side === 'buy' ? 'bg-[#22C55E] text-[#0A0B0D] hover:bg-[#16A34A]' : 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                }`}>
                {side === 'buy' ? 'Buy' : 'Sell'} {qty || 0} shares
              </Link>

              <div className="mt-4 text-xs text-white/20 text-center">
                Market order · Available balance: $15,165.40
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
