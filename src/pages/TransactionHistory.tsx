import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Calendar, ArrowDownLeft, ArrowUpRight, BarChart2, DollarSign, X, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { mockTransactions } from '../data/mock';

const filters = ['All', 'Deposits', 'Withdrawals', 'Buys', 'Sells', 'Fees'];

function txIcon(type: string) {
  switch (type) {
    case 'deposit': return <ArrowDownLeft size={14} className="text-[#22C55E]" />;
    case 'withdrawal': return <ArrowUpRight size={14} className="text-[#2F6BFF]" />;
    case 'buy': return <BarChart2 size={14} className="text-[#8B5CF6]" />;
    case 'sell': return <DollarSign size={14} className="text-[#22C55E]" />;
    default: return <Package size={14} className="text-black/40" />;
  }
}

function statusIcon(status: string) {
  switch (status) {
    case 'completed': return <CheckCircle size={13} className="text-[#22C55E]" />;
    case 'pending': return <Clock size={13} className="text-[#F59E0B]" />;
    case 'failed': return <AlertCircle size={13} className="text-[#EF4444]" />;
    default: return null;
  }
}

function statusChip(status: string) {
  if (status === 'completed') return 'chip-gain';
  if (status === 'pending') return 'chip-warning';
  if (status === 'failed') return 'chip-loss';
  return 'chip-neutral';
}

export default function TransactionHistory() {
  const [filter, setFilter] = useState('All');
  const [dateRange, setDateRange] = useState('This month');
  const [selectedTx, setSelectedTx] = useState<typeof mockTransactions[0] | null>(null);

  const filtered = mockTransactions.filter(tx => {
    if (filter === 'All') return true;
    if (filter === 'Deposits') return tx.type === 'deposit';
    if (filter === 'Withdrawals') return tx.type === 'withdrawal';
    if (filter === 'Buys') return tx.type === 'buy';
    if (filter === 'Sells') return tx.type === 'sell';
    if (filter === 'Fees') return tx.type === 'fee';
    return true;
  });

  const totalIn = mockTransactions.filter(t => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const totalOut = mockTransactions.filter(t => t.direction === 'out').reduce((s, t) => s + t.amount, 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] pt-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-col md:flex-row gap-4">
          <div>
            <h1 className="font-display font-700 text-3xl text-[#0A0B0D]">Transaction History</h1>
            <p className="text-black/40 text-sm mt-1">All your account activity in one place</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/5 border border-black/8 rounded-xl px-3 py-2.5">
              <Calendar size={14} className="text-black/40" />
              <select value={dateRange} onChange={e => setDateRange(e.target.value)}
                className="bg-transparent text-sm text-black/60 outline-none cursor-pointer">
                {['This week', 'This month', 'Last 3 months', 'This year', 'All time'].map(r => (
                  <option key={r} value={r} className="bg-white">{r}</option>
                ))}
              </select>
            </div>
            <button className="flex items-center gap-2 btn-ghost px-4 py-2.5 rounded-xl text-sm">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-2xl border border-black/8 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
              <ArrowDownLeft size={18} className="text-[#22C55E]" />
            </div>
            <div>
              <p className="text-xs text-black/30 mb-1">Total in</p>
              <p className="font-mono font-700 text-xl text-[#0A0B0D]">+${totalIn.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass rounded-2xl border border-black/8 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#2F6BFF]/10 flex items-center justify-center">
              <ArrowUpRight size={18} className="text-[#2F6BFF]" />
            </div>
            <div>
              <p className="text-xs text-black/30 mb-1">Total out</p>
              <p className="font-mono font-700 text-xl text-[#0A0B0D]">-${totalOut.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f ? 'bg-[#2F6BFF] text-white' : 'bg-black/5 text-black/50 hover:text-black hover:bg-black/10'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass rounded-2xl border border-black/8 overflow-hidden">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-6 py-4 border-b border-black/8 bg-black/2">
            {['Transaction', 'Asset', 'Amount', 'Status', 'Date'].map(h => (
              <span key={h} className="font-mono text-[10px] text-black/30 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <ArrowDownLeft size={32} className="text-black/15 mx-auto mb-4" />
              <p className="text-black/40 mb-4">No transactions yet</p>
              <Link to="/deposit" className="btn-primary px-5 py-2.5 rounded-xl text-sm">Make your first deposit</Link>
            </div>
          ) : (
            filtered.map(tx => (
              <div key={tx.id}>
                {/* Desktop row */}
                <button
                  onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                  className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] w-full px-6 py-4 border-b border-black/5 hover:bg-black/3 transition-colors items-center text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center">
                      {txIcon(tx.type)}
                    </div>
                    <span className="text-sm text-black/80">{tx.description}</span>
                  </div>
                  <span className="text-sm text-black/40">{tx.asset}</span>
                  <span className={`font-mono text-sm font-600 ${tx.direction === 'in' ? 'text-[#22C55E]' : tx.status === 'failed' ? 'text-[#EF4444]' : 'text-[#0A0B0D]'}`}>
                    {tx.direction === 'in' ? '+' : '-'}${tx.amount.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {statusIcon(tx.status)}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusChip(tx.status)}`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                  </div>
                  <span className="text-xs text-black/30 font-mono">{formatDate(tx.date)}</span>
                </button>

                {/* Mobile card */}
                <button
                  onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                  className="md:hidden w-full flex items-center gap-3 px-4 py-4 border-b border-black/5 hover:bg-black/3 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
                    {txIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-black/80 truncate">{tx.description}</p>
                    <p className="text-xs text-black/30 mt-0.5 font-mono">{formatDate(tx.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-sm font-600 ${tx.direction === 'in' ? 'text-[#22C55E]' : 'text-[#0A0B0D]'}`}>
                      {tx.direction === 'in' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </p>
                    <span className={`text-[10px] ${statusChip(tx.status)}`}>{tx.status}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {selectedTx?.id === tx.id && (
                  <div className="px-6 py-4 bg-black/2 border-b border-black/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[10px] text-black/25 mb-1 font-mono">TRANSACTION ID</p>
                        <p className="font-mono text-xs text-black/60">{tx.id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-black/25 mb-1 font-mono">FEE</p>
                        <p className="font-mono text-xs text-black/60">{tx.fee > 0 ? `$${tx.fee}` : 'Free'}</p>
                      </div>
                      {tx.rate && (
                        <div>
                          <p className="text-[10px] text-black/25 mb-1 font-mono">FX RATE</p>
                          <p className="font-mono text-xs text-black/60">{tx.rate}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-black/25 mb-1 font-mono">TYPE</p>
                        <p className="font-mono text-xs text-black/60 capitalize">{tx.type}</p>
                      </div>
                    </div>
                    {tx.status === 'failed' && (
                      <div className="mt-4 flex gap-3">
                        <Link to="/withdraw" className="text-xs text-black/60 hover:text-black py-2 px-4 rounded-lg bg-black/5">Try again</Link>
                        <Link to="/contact" className="text-xs text-[#2F6BFF] hover:text-[#4F82FF] py-2 px-4">Contact support</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
