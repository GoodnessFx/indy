import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Zap, Globe, Users, Clock, Star, ChevronRight, Play, Lock, BadgeCheck } from 'lucide-react';
import TickerStrip from '../components/TickerStrip';
import AssetImage from '../components/AssetImage';
import CurrencyCalculator from '../components/CurrencyCalculator';

function useCountUp(target: number, duration = 2000, prefix = '', suffix = '') {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { ref, display: `${prefix}${value.toLocaleString()}${suffix}` };
}

function StatCounter({ value, label, prefix = '', suffix = '' }: { value: number; label: string; prefix?: string; suffix?: string }) {
  const { ref, display } = useCountUp(value, 2000, prefix, suffix);
  return (
    <div ref={ref} className="text-center px-8 py-6 border-r border-[#0A0B0D]/10 last:border-r-0">
      <div className="font-display font-800 text-4xl lg:text-5xl text-[#0A0B0D] tabular-nums mb-2">{display}</div>
      <div className="text-sm text-[#0A0B0D]/50 font-body">{label}</div>
    </div>
  );
}

const featuredAssets = [
  {
    id: 1, type: 'NFT', name: 'Quantum Orchid #042', return: '+214%', price: '$14,700',
    image: 'photo-1634193295627-1cdddf751ebf',
    desc: 'Rare 1-of-10 generative artwork. Verified on-chain provenance.',
    color: '#8B5CF6',
  },
  {
    id: 2, type: 'Stock', name: 'NVDA, NVIDIA Corp.', return: '+38.2%', price: '$875.20',
    image: 'photo-1518770660439-4636190af475',
    desc: 'AI chip dominance. Surpassed $2T market cap in 2025.',
    color: '#22C55E',
  },
  {
    id: 3, type: 'Investment', name: 'Manhattan Luxury Tower', return: '8.2% p.a.', price: '$18M raised',
    image: 'photo-1486325212027-8081e485255e',
    desc: 'Fractional real estate in Midtown NYC. REIT-structured.',
    color: '#F59E0B',
  },
  {
    id: 4, type: 'Stock', name: 'ASTS, AST SpaceMobile', return: '+312%', price: '$42.18',
    image: 'photo-1451187580459-43490279c0fa',
    desc: 'Space-based global broadband. SpaceX launch partner.',
    color: '#2F6BFF',
  },
  {
    id: 5, type: 'Investment', name: 'Gold Reserve Series IV', return: '5.4% p.a.', price: '$4.7M raised',
    image: 'photo-1610375461369-d613b564f4c4',
    desc: 'Allocated LBMA-certified gold. Swiss vault custody.',
    color: '#F59E0B',
  },
];

const testimonials = [
  {
    quote: "IndySolutions made me feel like I had access to a private wealth desk. The interface is unlike anything else in fintech, it just works.",
    name: 'Aisha Okafor', role: 'Portfolio Manager, Lagos',
    avatar: 'photo-1531123897727-8f129e1688ce',
  },
  {
    quote: "I moved from three different apps to IndySolutions in a week. One dashboard for NFTs, stocks, and my real estate fund. Clean, fast, trustworthy.",
    name: 'Henrik Larsson', role: 'Angel Investor, Stockholm',
    avatar: 'photo-1472099645785-5658abf4ff4e',
  },
  {
    quote: "The withdrawal flow is the best I've seen in any financial app. I knew exactly what I'd receive before I confirmed anything.",
    name: 'Priya Nair', role: 'Venture Analyst, Singapore',
    avatar: 'photo-1531746020798-e6953c6e8e04',
  },
];

const mapDots = [
  { top: '30%', left: '22%', size: 'lg' }, { top: '40%', left: '48%', size: 'sm' },
  { top: '25%', left: '52%', size: 'md' }, { top: '45%', left: '72%', size: 'lg' },
  { top: '55%', left: '30%', size: 'md' }, { top: '35%', left: '78%', size: 'sm' },
  { top: '60%', left: '60%', size: 'md' }, { top: '28%', left: '35%', size: 'sm' },
];

export default function Home() {
  const [activeAsset, setActiveAsset] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-[#F7F7F5]">

      {/* 1. Hero, full-bleed cinematic */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop&auto=format"
            alt="Global markets at night"
            className="w-full h-full object-cover"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0B0D]/70 via-[#0A0B0D]/15 to-[#0A0B0D]/80" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(47,107,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(47,107,255,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#2F6BFF]/30 bg-[#2F6BFF]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] dot-pulse" />
            <span className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase">Markets are open</span>
          </div>

          <h1 className="font-display font-800 text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight mb-8">
            Your portfolio<br />
            <span className="text-white">should not look like everyone else's.</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl font-body max-w-xl mx-auto mb-12 leading-relaxed">
            NFTs, equities, vehicles, and curated private deals, verified, priced, and held in one account, with withdrawals in your own currency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary px-8 py-4 rounded-xl text-base flex items-center gap-2 w-full sm:w-auto justify-center">
              Open your account <ArrowRight size={18} />
            </Link>
            <Link to="/how-it-works" className="btn-ghost-dark-on-dark px-8 py-4 rounded-xl text-base flex items-center gap-2 w-full sm:w-auto justify-center">
              <Play size={16} /> See how it works
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-black/40" />
          <span className="text-[10px] text-[#0A0B0D] tracking-widest uppercase font-mono">Scroll</span>
        </div>
      </section>

      {/* 2. Live stat band */}
      <section className="bg-[#F7F7F5] py-16">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#0A0B0D]/10">
            <StatCounter value={2400000000} prefix="$" label="Total Value Secured" />
            <StatCounter value={147000} suffix="+" label="Assets Under Management" />
            <StatCounter value={68} suffix=" countries" label="Countries Served" />
            <StatCounter value={4} suffix="h avg." label="Withdrawal Time" />
          </div>
        </div>
      </section>

      {/* 3. Three-pillar showcase, dark image cards */}
      <section className="bg-[#0A0B0D] py-24 px-6 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-end justify-between mb-12 flex-col md:flex-row gap-4">
            <div>
              <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-3">Asset Classes</p>
              <h2 className="font-display font-800 text-4xl lg:text-5xl text-white leading-tight">
                Three markets.<br />One login.
              </h2>
            </div>
            <p className="text-white/40 text-sm max-w-sm leading-relaxed">
              Each asset class has its own browsing experience, tuned to how investors actually evaluate that type of asset.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Large NFT card */}
            <div className="lg:col-span-3 relative rounded-2xl overflow-hidden group card-hover border border-white/8 bg-[#111318]" style={{ minHeight: '420px' }}>
              <AssetImage
                seed="curated-digital-collectibles"
                label="Curated digital collectibles"
                className="absolute inset-0 w-full h-full opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-[#0A0B0D]/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="chip-accent text-xs px-3 py-1 rounded-full font-mono font-500 mb-3 inline-block">NFTs</span>
                <h3 className="font-display font-700 text-2xl text-white mb-2">Curated Digital Collectibles</h3>
                <p className="text-white/50 text-sm mb-5">Verified artwork, on-chain provenance, real investment value.</p>
                <Link to="/nfts" className="flex items-center gap-2 text-[#7DA6FF] text-sm font-medium hover:gap-3 transition-all">
                  Explore NFTs <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Two stacked smaller cards */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden group card-hover border border-white/8 bg-[#111318] flex-1" style={{ minHeight: '200px' }}>
                <AssetImage
                  seed="pillar-stocks"
                  label="Equities and ETFs"
                  className="absolute inset-0 w-full h-full opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="chip-gain text-xs px-3 py-1 rounded-full font-mono font-500 mb-2 inline-block">Stocks</span>
                  <h3 className="font-display font-700 text-xl text-white mb-1">Equities & ETFs</h3>
                  <Link to="/stocks" className="flex items-center gap-2 text-[#22C55E] text-sm font-medium hover:gap-3 transition-all">
                    Browse stocks <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden group card-hover border border-white/8 bg-[#111318] flex-1" style={{ minHeight: '200px' }}>
                <AssetImage
                  seed="pillar-alternative"
                  label="Alternative assets"
                  className="absolute inset-0 w-full h-full opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="chip-warning text-xs px-3 py-1 rounded-full font-mono font-500 mb-2 inline-block">Investments</span>
                  <h3 className="font-display font-700 text-xl text-white mb-1">Alternative Assets</h3>
                  <Link to="/investments" className="flex items-center gap-2 text-[#F59E0B] text-sm font-medium hover:gap-3 transition-all">
                    Explore deals <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator, currency and crypto estimate */}
      <section className="bg-[#F7F7F5] py-24 px-6">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-2xl mb-12 mx-auto text-center">
            <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-3">Convert</p>
            <h2 className="font-display font-800 text-4xl lg:text-5xl text-[#0A0B0D] leading-tight mb-4">
              Currency and crypto in one box
            </h2>
            <p className="text-black/45 leading-relaxed">
              Convert between EUR, USD, GBP, and BTC using the same live rates that price your withdrawals. Shown as an estimate because the exact rate locks in when you confirm.
            </p>
          </div>
          <div className="max-w-xl mx-auto">
            <CurrencyCalculator />
          </div>
        </div>
      </section>

      {/* 4. Product configurator carousel */}
      {/* 4. Featured showcase, dark cinematic card */}
      <section className="bg-[#0A0B0D] py-24 px-6 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-3">Featured Assets</p>
            <h2 className="font-display font-800 text-4xl lg:text-5xl text-white leading-tight">
              Handpicked for this quarter
            </h2>
          </div>

          {/* Large card */}
          <div className="relative bg-[#111318] rounded-3xl overflow-hidden mb-6" style={{ minHeight: '440px' }}>
            <AssetImage
              seed={featuredAssets[activeAsset].image}
              label={featuredAssets[activeAsset].name}
              className="absolute inset-0 w-full h-full opacity-70 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0D] via-[#0A0B0D]/70 to-transparent" />
            <div className="relative z-10 p-10 lg:p-14 max-w-lg">
              <span className="font-mono text-xs tracking-widest uppercase mb-4 inline-block px-3 py-1 rounded-full"
                style={{ background: `${featuredAssets[activeAsset].color}20`, color: featuredAssets[activeAsset].color }}>
                {featuredAssets[activeAsset].type}
              </span>
              <h3 className="font-display font-800 text-3xl lg:text-4xl text-white mb-3">{featuredAssets[activeAsset].name}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6">{featuredAssets[activeAsset].desc}</p>
              <div className="flex items-end gap-6 mb-8">
                <div>
                  <p className="text-white/40 text-xs mb-1">Current price</p>
                  <p className="font-mono font-600 text-2xl text-white">{featuredAssets[activeAsset].price}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Return</p>
                  <p className="font-mono font-600 text-2xl text-[#22C55E]">{featuredAssets[activeAsset].return}</p>
                </div>
              </div>
              <Link to="/signup" className="btn-primary px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2">
                Invest now <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {featuredAssets.map((asset, i) => (
              <button
                key={asset.id}
                onClick={() => setActiveAsset(i)}
                className={`shrink-0 relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  activeAsset === i ? 'ring-2 ring-[#2F6BFF] scale-105' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ width: '180px', height: '100px' }}
              >
                <AssetImage seed={asset.image} label={asset.name} showLabel={false} className="absolute inset-0 w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D]/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-medium truncate">{asset.name}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {featuredAssets.map((_, i) => (
              <button key={i} onClick={() => setActiveAsset(i)}
                className={`rounded-full transition-all duration-300 ${i === activeAsset ? 'w-6 h-2 bg-[#2F6BFF]' : 'w-2 h-2 bg-white/20'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. How it works, vertical stepper, dark rail */}
      <section className="bg-[#0A0B0D] py-24 px-6 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-3">Process</p>
              <h2 className="font-display font-800 text-4xl lg:text-5xl text-white">
                From zero to invested<br />in four steps
              </h2>
            </div>

            {[
              { n: '01', title: 'Create your account', body: 'Sign up with email or SSO in under 2 minutes. No paperwork walls, no jargon.' },
              { n: '02', title: 'Fund your account', body: 'Deposit via bank transfer, card, or crypto. Your balance is available instantly for trading.' },
              { n: '03', title: 'Invest across three asset classes', body: 'Buy curated NFTs, global equities, or access private deals, all from one portfolio view.' },
              { n: '04', title: 'Withdraw in your currency', body: 'Cash out to your bank or card. Live FX rates, transparent fees, no surprises.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-8 mb-12 last:mb-0 group">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/30 flex items-center justify-center font-mono font-600 text-[#7DA6FF] text-sm transition-all group-hover:bg-[#2F6BFF] group-hover:border-[#2F6BFF] group-hover:text-white">
                    {step.n}
                  </div>
                  {i < 3 && <div className="w-px flex-1 mt-3 stepper-line" style={{ minHeight: '40px' }} />}
                </div>
                <div className="pt-2.5 pb-10">
                  <h3 className="font-display font-700 text-xl text-white mb-2">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}

            <div className="text-center">
              <Link to="/how-it-works" className="text-[#7DA6FF] text-sm hover:text-white flex items-center gap-2 justify-center">
                Full walkthrough <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Security band, blue band */}
      <section className="bg-gradient-to-r from-[#0D1430] via-[#122454] to-[#0D1430] py-16 px-6 border-y border-[#2F6BFF]/20">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'Bank-grade encryption', body: 'AES-256 at rest, TLS 1.3 in transit. Your data never leaves encrypted channels.' },
              { icon: BadgeCheck, title: 'KYC / AML verified', body: 'Every user verified against global watchlists. Identity-checked onboarding, always.' },
              { icon: Shield, title: 'Licensed partners', body: 'Payments processed by regulated, PCI-DSS certified processors only.' },
              { icon: Zap, title: 'Insured custody', body: 'Digital assets custodied with FDIC-equivalent insurance on qualifying accounts.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon size={18} className="text-[#7DA6FF]" />
                </div>
                <div>
                  <p className="font-display font-600 text-sm text-white mb-1">{title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Live market ticker */}
      <TickerStrip />

      {/* 8. Testimonials, dark quote room */}
      <section className="bg-[#0A0B0D] py-28 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-12">Investor Stories</p>

          <div className="relative min-h-[200px]">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`absolute inset-0 flex flex-col items-center transition-all duration-700 ${
                  i === activeTestimonial ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                <blockquote className="font-display font-400 italic text-2xl lg:text-3xl text-white leading-relaxed mb-10">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <img src={`https://images.unsplash.com/${t.avatar}?w=96&h=96&fit=crop&crop=face&auto=format`} alt={t.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-[#2F6BFF]/40" />
                  <div className="text-left">
                    <p className="font-display font-600 text-sm text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`rounded-full transition-all ${i === activeTestimonial ? 'w-6 h-2 bg-[#2F6BFF]' : 'w-2 h-2 bg-white/20'}`} />
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-[#F59E0B] text-[#F59E0B]" />)}
              <span className="text-sm text-white/60 ml-2">4.9/5, 2,400 reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Global reach, map on dark */}
      <section className="bg-[#0A0B0D] py-24 px-6 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-4">Global Reach</p>
              <h2 className="font-display font-800 text-4xl lg:text-5xl text-white mb-6">
                68 countries.<br />6 languages.
              </h2>
              <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-sm">
                From Lagos to Singapore, Dubai to Sao Paulo, IndySolutions is built for a world that doesn't stop at borders.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {['English', 'Espanol', 'Francais', 'Portugues', 'Deutsch', 'AR'].map(lang => (
                  <div key={lang} className="px-3 py-2.5 rounded-xl border border-white/8 text-xs text-white/50 text-center">
                    {lang}
                  </div>
                ))}
              </div>
            </div>

            {/* Stylized map */}
            <div className="relative h-64 lg:h-80 bg-[#0d1020] rounded-2xl border border-white/5 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop&auto=format"
                alt="World map"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(47,107,255,0.15) 0%, transparent 70%)',
              }} />
              {mapDots.map((dot, i) => (
                <div key={i} className="absolute" style={{ top: dot.top, left: dot.left }}>
                  <div className={`rounded-full bg-[#2F6BFF] ${dot.size === 'lg' ? 'w-3 h-3' : dot.size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
                  <div className={`absolute inset-0 rounded-full bg-[#2F6BFF]/40 map-dot-ring`} />
                </div>
              ))}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#2F6BFF] dot-pulse" />
                <span className="font-mono text-[10px] text-white/40">Live investor activity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Final CTA, split screen on deep blue */}
      <section className="bg-gradient-to-br from-[#0A1030] via-[#16307A] to-[#0A0B0D] py-24 px-6 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="font-display font-800 text-5xl lg:text-6xl text-white leading-tight mb-8">
                Start investing<br />today.
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-10 max-w-sm">
                Open your account in minutes. No minimum investment to get started. Full KYC verification keeps your portfolio safe.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup" className="btn-primary px-8 py-4 rounded-xl text-base inline-flex items-center gap-2 justify-center">
                  Create free account <ArrowRight size={18} />
                </Link>
                <Link to="/contact" className="btn-ghost-dark-on-dark px-8 py-4 rounded-xl text-base inline-flex items-center gap-2 justify-center">
                  Talk to sales
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-10 flex-wrap">
                {[
                  { icon: Users, text: '147,000+ investors' },
                  { icon: Globe, text: '68 countries' },
                  { icon: Clock, text: '4h avg. withdrawal' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon size={14} className="text-[#7DA6FF]" />
                    <span className="text-sm text-white/50">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-[#0A0B0D]/8 shadow-2xl bg-white">
                <div className="bg-white px-4 py-3 border-b border-black/5 flex items-center gap-2">
                  {['bg-[#EF4444]', 'bg-[#F59E0B]', 'bg-[#22C55E]'].map(c => (
                    <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                  ))}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="skeleton h-3 w-24 mb-1.5" />
                      <div className="font-mono font-800 text-2xl text-[#0A0B0D]">$67,850.40</div>
                    </div>
                    <div className="chip-gain text-xs px-3 py-1.5 rounded-full font-mono">+18.2%</div>
                  </div>
                  <div className="h-28 bg-gradient-to-b from-[#2F6BFF]/20 to-transparent rounded-xl mb-4 flex items-end overflow-hidden">
                    <svg viewBox="0 0 300 80" className="w-full" preserveAspectRatio="none">
                      <polyline
                        points="0,70 40,55 80,60 120,40 160,30 200,35 240,20 280,10 300,5"
                        fill="none" stroke="#2F6BFF" strokeWidth="2"
                      />
                      <polygon
                        points="0,70 40,55 80,60 120,40 160,30 200,35 240,20 280,10 300,5 300,80 0,80"
                        fill="url(#grad)" fillOpacity="0.3"
                      />
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2F6BFF" />
                          <stop offset="100%" stopColor="#2F6BFF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'NVDA', val: '$4,376', change: '+38.2%', pos: true },
                      { name: 'Quantum Orchid #042', val: '$14,700', change: '+214%', pos: true },
                      { name: 'Manhattan Tower', val: '$5,200', change: '+8.2%', pos: true },
                    ].map(row => (
                      <div key={row.name} className="flex items-center justify-between py-2 border-b border-black/5">
                        <span className="text-xs text-black/60 truncate max-w-[140px]">{row.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-[#0A0B0D]">{row.val}</span>
                          <span className={`text-xs font-mono ${row.pos ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{row.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 glass rounded-xl px-4 py-2.5 border border-black/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E] dot-pulse" />
                  <span className="font-mono text-xs text-[#0A0B0D]">Live portfolio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
