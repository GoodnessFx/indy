import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Clock, Shield, BadgeCheck } from 'lucide-react';
import { mockInvestments } from '../data/mock';

export default function InvestmentDetail() {
  const { id } = useParams();
  const inv = mockInvestments.find(i => i.id === id) || mockInvestments[0];
  const raised = inv.raised >= 1000000 ? `$${(inv.raised / 1000000).toFixed(1)}M` : `$${(inv.raised / 1000).toFixed(0)}K`;
  const target = inv.target >= 1000000 ? `$${(inv.target / 1000000).toFixed(1)}M` : `$${(inv.target / 1000).toFixed(0)}K`;

  return (
    <div className="min-h-screen bg-[#0A0B0D] pt-20">
      {/* Hero */}
      <div className="relative h-72 lg:h-96 overflow-hidden">
        <img
          src={`https://images.unsplash.com/${inv.image}?w=1440&h=500&fit=crop&auto=format`}
          alt={inv.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/30 to-transparent" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 -mt-8 relative z-10">
        <Link to="/investments" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to Investments
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
          {/* Content */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B]">{inv.category}</span>
              {inv.verified && (
                <span className="flex items-center gap-1 text-xs text-[#2F6BFF]"><BadgeCheck size={12} /> Verified</span>
              )}
            </div>
            <h1 className="font-display font-800 text-3xl lg:text-4xl text-white mb-6">{inv.name}</h1>
            <p className="text-white/50 leading-relaxed mb-8">{inv.description}</p>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { icon: TrendingUp, label: 'Expected Return', value: `${inv.returnMin}–${inv.returnMax}% p.a.`, color: 'text-[#22C55E]' },
                { icon: Clock, label: 'Timeline', value: inv.timeline, color: 'text-[#2F6BFF]' },
                { icon: Shield, label: 'Status', value: inv.verified ? 'Verified' : 'Unverified', color: 'text-[#F59E0B]' },
                { icon: TrendingUp, label: 'Category', value: inv.category, color: 'text-white/60' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="glass rounded-2xl border border-white/8 p-4">
                  <Icon size={16} className={`${color} mb-2`} />
                  <p className="text-[10px] text-white/30 mb-1 font-mono">{label.toUpperCase()}</p>
                  <p className="font-mono font-600 text-sm text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl border border-white/8 p-6">
              <h3 className="font-display font-600 text-base text-white mb-4">About this investment</h3>
              <p className="text-sm text-white/40 leading-relaxed mb-4">{inv.description}</p>
              <p className="text-sm text-white/40 leading-relaxed">
                This investment is structured as a regulated vehicle with quarterly reporting. All investor communications are sent via email and available in your transaction history. Estimated returns are projections only and not guaranteed.
              </p>
            </div>
          </div>

          {/* Invest panel */}
          <div className="lg:sticky lg:top-24">
            <div className="glass rounded-2xl border border-white/8 p-6">
              <div className="mb-5">
                <p className="text-xs text-white/30 mb-3 font-mono">FUNDING PROGRESS</p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-mono font-600 text-white">{raised}</span>
                  <span className="text-white/30">of {target}</span>
                </div>
                <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full progress-bar rounded-full" style={{ width: `${inv.progress}%` }} />
                </div>
                <p className="text-xs text-white/30 mt-2">{inv.progress}% funded</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-white/40 mb-2">Investment amount (USD)</label>
                  <input
                    type="number"
                    defaultValue="5000"
                    min="1000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#F59E0B] transition-colors font-mono"
                  />
                  <p className="text-[10px] text-white/25 mt-1">Minimum: $1,000</p>
                </div>
                <div className="bg-white/3 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Projected annual return</span>
                    <span className="font-mono text-[#22C55E]">{inv.returnMin}–{inv.returnMax}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Lock-up period</span>
                    <span className="font-mono text-white">{inv.timeline}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Platform fee</span>
                    <span className="font-mono text-white">1.5% p.a.</span>
                  </div>
                </div>
              </div>

              <Link to="/signup" className="w-full block text-center btn-primary py-4 rounded-xl text-sm font-display font-600">
                Invest now
              </Link>

              <p className="text-[10px] text-white/20 text-center mt-3 leading-relaxed">
                Returns are projections. Investments may lose value. Consult a financial advisor before investing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
