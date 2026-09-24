import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BatteryCharging, Gauge, Zap, Users, ArrowRight, ShieldCheck, TrendingUp, Layers } from 'lucide-react';
import { mockVehicles } from '../data/mock';

// Configurator-style page: deliberate contrast with the NFT grid, stock table,
// and editorial feed. One model at a time, cinematic full-bleed hero, spec strip.
export default function Vehicles() {
  const [activeId, setActiveId] = useState(mockVehicles[0].id);
  const active = mockVehicles.find(v => v.id === activeId) ?? mockVehicles[0];

  const specs = [
    { icon: BatteryCharging, label: 'Range (EPA est.)', value: `${active.rangeMi} mi` },
    { icon: Gauge, label: '0-60 mph', value: `${active.zeroToSixty}s` },
    { icon: Zap, label: 'Top speed', value: `${active.topSpeedMph} mph` },
    { icon: Users, label: 'Seats', value: `${active.seats}` },
  ];

  return (
    <div className="min-h-screen bg-[#0A0B0D]">
      {/* Model selector rail */}
      <div className="fixed lg:sticky top-16 lg:top-20 z-30 bg-[#0A0B0D]/95 backdrop-blur-xl border-b border-white/5 w-full">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3">
            {mockVehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setActiveId(v.id)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeId === v.id
                    ? 'bg-[#2F6BFF] text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Full-bleed cinematic hero per model. One real photo per model. */}
      <div className="relative min-h-[82vh] flex items-end overflow-hidden" key={active.id}>
        <img
          src={active.photo}
          alt={`Tesla ${active.name}`}
          className="absolute inset-0 w-full h-full object-cover fade-in-up"
          loading="eager"
        />
        <div className="absolute inset-0 photo-tint-bottom" />

        <div className="relative max-w-[1440px] mx-auto px-6 lg:px-12 w-full pb-12 lg:pb-16 pt-40">
          <p className="font-mono text-xs text-[#7DA6FF] tracking-widest uppercase mb-4 fade-in-up">Vehicle-Backed Fleet</p>
          <h1 className="font-display font-800 text-6xl lg:text-8xl text-white tracking-tight mb-4 fade-in-up">
            {active.name}
          </h1>
          <p className="text-white/60 text-base lg:text-lg max-w-xl mb-8 fade-in-up">{active.tagline}</p>
          <p className="font-mono text-[11px] text-white/25 mb-8 fade-in-up">Photo: {active.credit}</p>

          {/* Spec strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/15 rounded-2xl overflow-hidden border border-white/15 max-w-3xl mb-4">
            {specs.map(s => (
              <div key={s.label} className="bg-[#0A0B0D]/70 backdrop-blur-md px-5 py-4">
                <div className="flex items-center gap-1.5 text-white/40 mb-1.5">
                  <s.icon size={14} />
                  <span className="text-[11px] uppercase tracking-wide">{s.label}</span>
                </div>
                <p className="font-mono font-600 text-lg text-white">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <p className="font-mono text-white/60 text-sm">
              From <span className="text-white font-600 text-base">${active.price.toLocaleString()}</span>
            </p>
            <div className="h-6 w-px bg-white/20" />
            <Link to="/signup" className="btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2">
              Reserve allocation <ArrowRight size={15} />
            </Link>
            <Link to="/contact" className="btn-ghost-dark-on-dark px-6 py-3 rounded-xl text-sm">
              Talk to sales
            </Link>
          </div>
        </div>
      </div>

      {/* How fractional vehicle exposure works */}
      <div className="border-t border-white/5 bg-[#0A0B0D]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-24 items-start">
            <div>
              <p className="font-mono text-xs text-[#7DA6FF] tracking-widest uppercase mb-3">Fractional Exposure</p>
              <h2 className="font-display font-700 text-3xl lg:text-5xl text-white mb-6">
                You do not buy the car. You buy the fleet share behind it.
              </h2>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Each listing above represents a share in a managed vehicle pool. The fleet is leased to
                vetted operators, and income flows back to shareholders monthly. Resale events return
                proceeds proportional to your share.
              </p>
              <p className="text-white/50 text-sm leading-relaxed">
                Specs shown are the manufacturer figures for the underlying model. Pricing reflects the
                current fleet acquisition cost and moves with manufacturer adjustments.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Layers, title: 'Fleet-backed shares', body: 'Every share maps to a specific vehicle in an insured, managed pool.' },
                { icon: TrendingUp, title: 'Monthly income', body: 'Lease income is distributed monthly, net of fleet operating costs.' },
                { icon: ShieldCheck, title: 'Insured custody', body: 'Comprehensive coverage on every unit, with quarterly condition audits.' },
              ].map(card => (
                <div key={card.title} className="rounded-2xl border border-white/8 bg-[#12141A] p-6">
                  <div className="w-10 h-10 rounded-xl bg-[#2F6BFF]/15 flex items-center justify-center mb-4">
                    <card.icon size={18} className="text-[#7DA6FF]" />
                  </div>
                  <h3 className="font-display font-600 text-sm text-white mb-2">{card.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Current model context */}
          <div className="mt-12 rounded-2xl border border-[#2F6BFF]/25 bg-gradient-to-r from-[#2F6BFF]/15 to-transparent px-6 lg:px-8 py-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="shrink-0">
              <p className="text-xs text-white/30 mb-1">Allocation note, {active.name}</p>
              <p className="text-sm text-white/70 max-w-xl">{active.note}</p>
            </div>
            <div className="md:ml-auto flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
              <span className="text-xs text-white/50">Allocation window open</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
