import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Star } from 'lucide-react';
import { isWatched, toggleWatch } from '../lib/watchlist';
import {
  InvestAwaitingPayment,
  InvestShell,
  InvestSignInGate,
  useInvestFlow,
  FeeBreakdownBlock,
  FeeScheduleNote,
} from '../components/InvestModal';
import { useAuth } from '../lib/useAuth';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar } from 'recharts';
import { allStocks } from '../data/catalog';

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
  const stock = allStocks.find(s => s.id === id) || allStocks[0];
  const [qty, setQty] = useState('5');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [timeRange, setTimeRange] = useState('6M');
  const [watching, setWatching] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const { signedIn, profile } = useAuth();
  const invest = useInvestFlow(
    { assetId: stock.id, assetName: `${stock.id}, ${stock.name}`, kind: 'stock', price: stock.price },
  );

  useEffect(() => {
    setWatching(isWatched(stock.id));
  }, [stock.id]);

  const total = (parseFloat(qty) || 0) * stock.price;

  return (
    <div className="min-h-screen bg-[#F7F7F5] pt-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
        <Link to="/stocks" className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black mb-8 transition-colors">
          <ArrowLeft size={15} /> Back to Stocks
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Left */}
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-8 flex-col sm:flex-row gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-800 text-2xl text-[#0A0B0D]">{stock.id}</span>
                  <span className="text-xs chip-accent px-2.5 py-1 rounded-full font-mono">{stock.sector}</span>
                </div>
                <p className="text-black/40">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-800 text-4xl text-[#0A0B0D]">${stock.price.toFixed(2)}</p>
                <div className={`flex items-center gap-1.5 justify-end mt-1 ${stock.changePct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {stock.changePct >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                  <span className="font-mono font-600">{stock.changePct >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePct >= 0 ? '+' : ''}{stock.changePct}%)</span>
                  <span className="text-black/30 text-xs">today</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="glass rounded-2xl border border-black/8 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-600 text-base text-[#0A0B0D]">Price chart</h3>
                <div className="flex items-center gap-1 bg-black/5 rounded-xl p-1">
                  {['1D', '1W', '1M', '6M', '1Y'].map(r => (
                    <button key={r} onClick={() => setTimeRange(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-600 transition-all ${
                        timeRange === r ? 'bg-[#22C55E] text-[#0A0B0D]' : 'text-black/40 hover:text-black/70'
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
                  <XAxis dataKey="date" tick={{ fill: 'rgba(0,0,0,0.45)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(0,0,0,0.45)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', color: '#F7F7F5' }} />
                  <Bar dataKey="volume" fill="rgba(34,197,94,0.1)" yAxisId="vol" />
                  <Line type="monotone" dataKey="close" stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#22C55E' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Key stats */}
            <div className="glass rounded-2xl border border-black/8 p-6">
              <h3 className="font-display font-600 text-base text-[#0A0B0D] mb-5">Key statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Market Cap', value: stock.cap },
                  { label: 'Volume (24h)', value: stock.volume },
                  { label: 'P/E Ratio', value: '68.2' },
                  { label: 'Day Range', value: '$850 to $880' },
                  { label: '52W High', value: '$974.00' },
                  { label: '52W Low', value: '$612.00' },
                  { label: 'Avg. Volume', value: '38.2M' },
                  { label: 'Beta', value: '1.72' },
                ].map(stat => (
                  <div key={stat.label} className="bg-black/3 rounded-xl p-3">
                    <p className="text-[10px] text-black/30 mb-1 font-mono">{stat.label}</p>
                    <p className="font-mono font-600 text-sm text-[#0A0B0D]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buy/Sell panel */}
          <div className="lg:sticky lg:top-24 self-start">
            <div className="glass rounded-2xl border border-black/8 p-6">
              <div className="flex rounded-xl bg-black/5 p-1 mb-6">
                {(['buy', 'sell'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-display font-600 capitalize transition-all ${
                      side === s
                        ? s === 'buy' ? 'bg-[#22C55E] text-[#0A0B0D]' : 'bg-[#EF4444] text-white'
                        : 'text-black/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-black/40 mb-2">Quantity (shares)</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    min="1"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#22C55E] transition-colors font-mono"
                  />
                </div>
                <div className="bg-black/3 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-black/40">Market price</span>
                    <span className="font-mono text-[#0A0B0D]">${stock.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black/40">Shares</span>
                    <span className="font-mono text-[#0A0B0D]">{qty || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black/40 flex items-center gap-1">
                      Commission <Info size={11} />
                    </span>
                    <span className="font-mono text-[#0A0B0D]">${(total * 0.001).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-black/8 pt-2.5">
                    <span className="font-display font-600 text-sm text-[#0A0B0D]">Total</span>
                    <span className="font-mono font-700 text-lg text-[#0A0B0D]">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            <div>
              <button onClick={() => setInvestOpen(true)} className={`w-full block text-center py-4 rounded-xl font-display font-600 text-sm transition-all ${
                side === 'buy' ? 'bg-[#22C55E] text-[#0A0B0D] hover:bg-[#16A34A]' : 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
              }`}>
                {side === 'buy' ? 'Buy' : 'Sell'} {qty || 0} shares
              </button>

              {investOpen && (
                <InvestShell
                  title={`${stock.id}, ${stock.name}`}
                  subtitle={signedIn && profile ? `Signed in as ${profile.email}` : 'Sign-in required'}
                  onClose={() => setInvestOpen(false)}
                >
                  {!signedIn ? (
                    <InvestSignInGate />
                  ) : invest.phase === 'form' ? (
                    <>
                      <label className="block text-xs text-black/40 mb-2">Amount (USD)</label>
                      <input
                        type="number"
                        min="1"
                        value={invest.amount}
                        onChange={e => invest.setAmount(e.target.value)}
                        className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#22C55E] mb-4"
                      />
                      <button onClick={invest.submit} disabled={invest.amt <= 0} className="btn-primary w-full py-3.5 rounded-xl text-sm disabled:opacity-50">
                        Submit investment
                      </button>
                      <FeeBreakdownBlock amount={invest.amt} kind="stock" />
                      <FeeScheduleNote />
                    </>
                  ) : invest.phase === 'submitted' ? (
                    <InvestAwaitingPayment onPay={invest.pay} onLater={() => setInvestOpen(false)} />
                  ) : (
                    <p className="text-sm text-[#22C55E] text-center py-4">Holding active. See it in your dashboard.</p>
                  )}
                </InvestShell>
              )}
            </div>

              <div className="mt-4 text-xs text-black/20 text-center">
                Market order, Available balance: $15,165.40
              </div>
              <button
                onClick={() => {
                  const next = toggleWatch({
                    id: stock.id,
                    kind: 'stock',
                    name: `${stock.id}, ${stock.name}`,
                    target: Number(stock.price.toFixed(2)),
                    currency: 'USD',
                  });
                  setWatching(next.some(w => w.id === stock.id));
                }}
                aria-pressed={watching}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-colors ${
                  watching
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                    : 'btn-ghost'
                }`}
              >
                <Star size={15} fill={watching ? 'currentColor' : 'none'} />
                {watching ? 'Watching' : 'Watch this stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
