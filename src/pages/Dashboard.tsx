import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, MessageCircle, BarChart2, Wallet, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { portfolioChartData, mockNFTs, mockStocks, mockInvestments } from '../data/mock';
import FxCalculator from '../components/FxCalculator';

const timeRanges = ['1D', '1W', '1M', '1Y', 'All'];

const skeletonRows = 3;

export default function Dashboard() {
  const [hideBalance, setHideBalance] = useState(false);
  const [segment, setSegment] = useState<'All' | 'NFTs' | 'Stocks' | 'Other'>('All');
  const [timeRange, setTimeRange] = useState('1M');
  const [loading] = useState(false);

  const holdings = [
    { id: 'nft-1', type: 'NFT', name: 'Quantum Orchid #042', value: 14700, cost: 4700, gain: 10000, gainPct: 212.8, image: 'photo-1634193295627-1cdddf751ebf', status: 'active' },
    { id: 'nft-2', type: 'NFT', name: 'Void Walker #009', value: 6300, cost: 7200, gain: -900, gainPct: -12.5, image: 'photo-1618005182384-a83a8bd57fbe', status: 'active' },
    { id: 'NVDA', type: 'Stock', name: 'NVDA · NVIDIA Corp.', value: 4376, cost: 3160, gain: 1216, gainPct: 38.5, image: null, status: 'active' },
    { id: 'ASTS', type: 'Stock', name: 'ASTS · AST SpaceMobile', value: 2109, cost: 1750, gain: 359, gainPct: 20.5, image: null, status: 'active' },
    { id: 'inv-1', type: 'Other', name: 'Manhattan Luxury Tower', value: 5200, cost: 5000, gain: 200, gainPct: 4.0, image: null, status: 'active' },
    { id: 'inv-2', type: 'Other', name: 'Gold Reserve Series IV', value: 2100, cost: 2000, gain: 100, gainPct: 5.0, image: null, status: 'active' },
  ];

  const filtered = segment === 'All' ? holdings : holdings.filter(h => {
    if (segment === 'NFTs') return h.type === 'NFT';
    if (segment === 'Stocks') return h.type === 'Stock';
    return h.type === 'Other';
  });

  const totalBalance = holdings.reduce((s, h) => s + h.value, 0);
  const totalGain = holdings.reduce((s, h) => s + h.gain, 0);
  const totalGainPct = ((totalGain / (totalBalance - totalGain)) * 100).toFixed(2);

  const typeToPath = (type: string, id: string) => {
    if (type === 'NFT') return `/nfts/${id}`;
    if (type === 'Stock') return `/stocks/${id}`;
    return `/investments/${id}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] pt-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-10 flex-col md:flex-row gap-6">
          <div>
            <p className="text-white/40 text-sm mb-2">Good morning, Marcus</p>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-xs text-white/30 mb-1 font-mono">TOTAL PORTFOLIO VALUE</p>
                <div className="flex items-center gap-3">
                  <span className="font-display font-800 text-4xl lg:text-5xl text-white tabular-nums">
                    {hideBalance ? '••••••' : `$${totalBalance.toLocaleString()}`}
                  </span>
                  <button onClick={() => setHideBalance(!hideBalance)} className="text-white/30 hover:text-white/60 transition-colors mt-1">
                    {hideBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 pb-2 ${totalGain >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                {totalGain >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="font-mono text-sm font-600">
                  {hideBalance ? '••••' : `${totalGain >= 0 ? '+' : ''}$${Math.abs(totalGain).toLocaleString()} (${totalGain >= 0 ? '+' : ''}${totalGainPct}%)`}
                </span>
                <span className="text-white/30 text-xs">all time</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-3">
            {[
              { label: 'Deposit', icon: ArrowDownLeft, to: '/deposit', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10 hover:bg-[#22C55E]/20' },
              { label: 'Withdraw', icon: ArrowUpRight, to: '/withdraw', color: 'text-[#2F6BFF]', bg: 'bg-[#2F6BFF]/10 hover:bg-[#2F6BFF]/20' },
              { label: 'Support', icon: MessageCircle, to: '#support', color: 'text-white/60', bg: 'bg-white/5 hover:bg-white/10' },
            ].map(({ label, icon: Icon, to, color, bg }) => (
              <Link
                key={label}
                to={to}
                className={`flex flex-col items-center gap-1.5 w-20 py-3 rounded-xl ${bg} transition-colors`}
              >
                <Icon size={18} className={color} />
                <span className="text-xs text-white/50">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Live FX calculator */}
        <div className="mb-8"><FxCalculator /></div>

        {/* Performance chart */}
        <div className="glass rounded-2xl border border-white/8 p-6 mb-8">
          <div className="flex items-center justify-between mb-6 flex-col sm:flex-row gap-4">
            <h3 className="font-display font-600 text-lg text-white">Portfolio Performance</h3>
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {timeRanges.map(r => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-600 transition-all ${
                    timeRange === r ? 'bg-[#2F6BFF] text-white' : 'text-white/40 hover:text-white/70'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={portfolioChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2F6BFF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2F6BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#F7F7F5' }}
                formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, 'Value']}
              />
              <Area type="monotone" dataKey="value" stroke="#2F6BFF" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} activeDot={{ r: 4, fill: '#2F6BFF' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Holdings */}
        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h3 className="font-display font-600 text-lg text-white">Holdings</h3>
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {(['All', 'NFTs', 'Stocks', 'Other'] as const).map(s => (
                <button key={s} onClick={() => setSegment(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    segment === s ? 'bg-[#2F6BFF] text-white' : 'text-white/40 hover:text-white/70'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(skeletonRows)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <div className="skeleton h-3 w-40 mb-2" />
                    <div className="skeleton h-2.5 w-20" />
                  </div>
                  <div className="skeleton h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Wallet size={32} className="text-white/20 mx-auto mb-4" />
              <p className="text-sm text-white/40 mb-4">No {segment !== 'All' ? segment.toLowerCase() : 'holdings'} yet</p>
              <Link to={segment === 'NFTs' ? '/nfts' : segment === 'Stocks' ? '/stocks' : '/investments'} className="btn-primary px-5 py-2.5 rounded-xl text-sm">
                Browse assets
              </Link>
            </div>
          ) : (
            <div>
              {/* Table header — desktop only */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] px-6 py-3 bg-white/2 border-b border-white/5">
                {['Asset', 'Value', 'Cost basis', 'Gain/Loss'].map(h => (
                  <span key={h} className="text-xs text-white/30 font-medium font-mono">{h}</span>
                ))}
              </div>

              {filtered.map(holding => (
                <Link
                  key={holding.id}
                  to={typeToPath(holding.type, holding.id)}
                  className="flex items-center gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/3 transition-colors group"
                >
                  {/* Asset info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 ${!holding.image ? 'bg-[#2F6BFF]/10 flex items-center justify-center' : ''}`}>
                      {holding.image ? (
                        <img src={`https://images.unsplash.com/${holding.image}?w=40&h=40&fit=crop&auto=format`} alt={holding.name} className="w-full h-full object-cover" />
                      ) : (
                        <BarChart2 size={16} className="text-[#2F6BFF]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-[#2F6BFF] transition-colors">{holding.name}</p>
                      <p className="text-xs text-white/30 mt-0.5">{holding.type}</p>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right md:text-left min-w-[80px]">
                    <p className="font-mono text-sm text-white font-600">${holding.value.toLocaleString()}</p>
                  </div>

                  {/* Cost */}
                  <div className="hidden md:block min-w-[80px]">
                    <p className="font-mono text-sm text-white/40">${holding.cost.toLocaleString()}</p>
                  </div>

                  {/* Gain */}
                  <div className="hidden md:block text-right min-w-[100px]">
                    <p className={`font-mono text-sm font-600 ${holding.gain >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {holding.gain >= 0 ? '+' : ''}${Math.abs(holding.gain).toLocaleString()}
                    </p>
                    <p className={`font-mono text-xs ${holding.gain >= 0 ? 'text-[#22C55E]/60' : 'text-[#EF4444]/60'}`}>
                      {holding.gainPct >= 0 ? '+' : ''}{holding.gainPct.toFixed(2)}%
                    </p>
                  </div>

                  {/* Mobile gain badge */}
                  <div className="md:hidden">
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${holding.gain >= 0 ? 'chip-gain' : 'chip-loss'}`}>
                      {holding.gainPct >= 0 ? '+' : ''}{holding.gainPct.toFixed(1)}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="p-4 flex items-center justify-between">
              <p className="text-xs text-white/30">{filtered.length} positions</p>
              <div className="flex items-center gap-2 text-xs text-white/30">
                <RefreshCw size={11} />
                <span>Updated just now</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/transactions" className="glass rounded-2xl border border-white/8 p-5 hover:border-[#2F6BFF]/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 font-medium">Recent transactions</span>
              <ArrowUpRight size={14} className="text-white/20 group-hover:text-[#2F6BFF] transition-colors" />
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Bank deposit', amount: '+$10,000', type: 'in', date: 'Sep 20' },
                { label: 'NVDA purchase', amount: '-$4,376', type: 'out', date: 'Sep 19' },
                { label: 'Withdrawal pending', amount: '-$3,200', type: 'pending', date: 'Sep 17' },
              ].map(tx => (
                <div key={tx.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/60">{tx.label}</p>
                    <p className="text-[10px] text-white/25">{tx.date}</p>
                  </div>
                  <span className={`font-mono text-xs font-600 ${tx.type === 'in' ? 'text-[#22C55E]' : tx.type === 'pending' ? 'text-[#F59E0B]' : 'text-white/50'}`}>
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </Link>

          <Link to="/deposit" className="glass rounded-2xl border border-white/8 p-5 hover:border-[#22C55E]/30 transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                <ArrowDownLeft size={18} className="text-[#22C55E]" />
              </div>
              <div>
                <p className="text-sm font-display font-600 text-white">Make a deposit</p>
                <p className="text-xs text-white/30">Bank · Card · Crypto</p>
              </div>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">Funds available instantly for trading once confirmed.</p>
          </Link>

          <Link to="/withdraw" className="glass rounded-2xl border border-white/8 p-5 hover:border-[#2F6BFF]/30 transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#2F6BFF]/10 flex items-center justify-center">
                <ArrowUpRight size={18} className="text-[#2F6BFF]" />
              </div>
              <div>
                <p className="text-sm font-display font-600 text-white">Withdraw funds</p>
                <p className="text-xs text-white/30">Bank · Card · 4h avg.</p>
              </div>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">Live FX rates with full fee breakdown before you confirm.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
