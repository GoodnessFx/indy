import { Link } from 'react-router-dom';
import { useState } from 'react';
import { BadgeCheck, TrendingUp, Clock } from 'lucide-react';
import { allInvestments, investmentCategories } from '../data/catalog';
import AssetImage from '../components/AssetImage';

const categories = investmentCategories;

export default function OtherInvestments() {
  const [category, setCategory] = useState('All');

  const filtered = allInvestments.filter(inv =>
    category === 'All' || inv.category === category
  );

  const formatRaised = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;

  return (
    <div className="min-h-screen bg-[#F7F7F5] pt-20">
      <div className="border-b border-black/5">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
          <p className="font-mono text-xs text-[#F59E0B] tracking-widest uppercase mb-3">Alternative Assets</p>
          <h1 className="font-display font-800 text-4xl lg:text-5xl text-[#0A0B0D] mb-3">Investment Deals</h1>
          <p className="text-black/40 text-sm max-w-lg">Real estate, commodities, and private deals. Each asset needs context, we give you the full picture.</p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
        {/* Category chips */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                category === c ? 'bg-[#F59E0B] text-[#0A0B0D]' : 'bg-black/5 text-black/50 hover:text-black hover:bg-black/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Editorial card feed */}
        <div className="space-y-6">
          {filtered.map(inv => (
            <Link
              key={inv.id}
              to={`/investments/${inv.id}`}
              className="block rounded-2xl overflow-hidden border border-black/8 bg-white card-hover group"
            >
              <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] lg:grid-cols-[420px_1fr]">
                {/* Photo */}
                <div className="relative overflow-hidden h-52 md:h-auto" style={{ minHeight: '220px' }}>
                  <AssetImage
                    seed={inv.image}
                    label={inv.name}
                    className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 photo-tint-side" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] font-medium">{inv.category}</span>
                    {inv.verified && (
                      <span className="flex items-center gap-1 text-xs text-[#2F6BFF]">
                        <BadgeCheck size={12} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 lg:p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-700 text-xl text-[#0A0B0D] group-hover:text-[#F59E0B] transition-colors mb-3">
                      {inv.name}
                    </h3>
                    <p className="text-sm text-black/50 leading-relaxed mb-6">{inv.description}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-black/30">Funding progress</span>
                      <span className="font-mono text-black/60">{inv.progress}%, {formatRaised(inv.raised)} of {formatRaised(inv.target)}</span>
                    </div>
                    <div className="h-1.5 bg-black/8 rounded-full overflow-hidden">
                      <div className="h-full progress-bar rounded-full transition-all" style={{ width: `${inv.progress}%` }} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-[#22C55E] mb-1">
                        <TrendingUp size={12} />
                        <span className="text-xs text-black/30">Return</span>
                      </div>
                      <p className="font-mono font-600 text-sm text-[#0A0B0D]">{inv.returnMin} to {inv.returnMax}% p.a.</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[#2F6BFF] mb-1">
                        <Clock size={12} />
                        <span className="text-xs text-black/30">Timeline</span>
                      </div>
                      <p className="font-mono font-600 text-sm text-[#0A0B0D]">{inv.timeline}</p>
                    </div>
                    <div className="flex items-end">
                      <span className={`text-[10px] px-2.5 py-1.5 rounded-full font-medium ${
                        inv.progress > 80 ? 'chip-warning' : 'chip-accent'
                      }`}>
                        {inv.progress > 80 ? 'Closing soon' : 'Open'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
