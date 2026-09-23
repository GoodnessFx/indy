import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';

const steps = [
  {
    n: '01', title: 'Create your account', image: 'photo-1614854262318-831574f15f1f',
    body: 'Sign up with your email or Google/Apple SSO. No commitments, no minimum. Your account is ready in under 2 minutes.',
    details: ['Email or SSO in under 2 minutes', 'No minimum investment required', 'Available in 6 languages', 'Mobile and desktop support'],
  },
  {
    n: '02', title: 'Complete identity verification', image: 'photo-1454165804606-c3d57bc86b40',
    body: 'Upload a government-issued ID and complete our KYC process. Required by regulation, takes minutes. Your documents are encrypted and never stored longer than legally required.',
    details: ['Passport, driver\'s license, or national ID', 'Automated document scanning', 'Usually reviewed within 24 hours', 'AES-256 encrypted document storage'],
  },
  {
    n: '03', title: 'Fund your account', image: 'photo-1563013544-824ae1b704d3',
    body: 'Deposit via bank transfer, debit/credit card, or crypto (USDT/BTC). Funds appear in your account balance immediately for cards, or when confirmed for bank transfers and crypto.',
    details: ['Bank transfer, card, or crypto', 'Live FX conversion rates', 'Secure PCI-DSS certified processing', 'Deposit insurance on qualifying amounts'],
  },
  {
    n: '04', title: 'Invest across three asset classes', image: 'photo-1611974789855-9c2a0a7236a3',
    body: 'Browse verified NFTs, real-time stock markets, or curated alternative investment deals — all from one portfolio view. Buy, hold, and monitor everything in one place.',
    details: ['NFT marketplace with on-chain verification', 'Global equities and ETFs', 'Curated alternative investments', 'Real-time portfolio tracking'],
  },
];

const faqs = [
  { q: 'Is IndySolutions regulated?', a: 'IndySolutions operates under applicable financial regulations in each jurisdiction it serves. Our payment processing is handled by licensed, PCI-DSS compliant partners. For specific regulatory details, see our Security & Trust page.' },
  { q: 'What are the minimum investments?', a: 'There is no minimum for stock trading. NFT purchases are at market price. Alternative investment minimums vary by deal, typically starting at $1,000.' },
  { q: 'How are my assets held?', a: 'Stocks are held in your name via our regulated custody partner. NFTs are held in a custodial wallet on your behalf. Alternative investments are held per the terms of each deal structure.' },
  { q: 'Can I use IndySolutions from any country?', a: 'IndySolutions is available in 68 countries. Some features may be restricted based on local regulations. You\'ll be informed at signup if any limitations apply to your country.' },
  { q: 'How fast are withdrawals?', a: 'Card withdrawals process in 0–24 hours. Bank transfers take 1–3 business days. Our average withdrawal time is 4 hours.' },
];

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="bg-[#F7F7F5]">
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-[#0A0B0D]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-4">Process</p>
          <h1 className="font-display font-800 text-5xl lg:text-7xl text-white leading-tight mb-6">
            How IndySolutions works
          </h1>
          <p className="text-white/40 text-lg leading-relaxed">
            From account creation to your first investment — every step, explained clearly.
          </p>
        </div>
      </section>

      {/* Steps — full viewport sections */}
      {steps.map((step, i) => (
        <section key={step.n} className={`py-28 px-6 ${i % 2 === 0 ? 'bg-[#F7F7F5]' : 'bg-[#0A0B0D]'}`}>
          <div className="max-w-[1200px] mx-auto">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${i % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
              <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                <span className={`font-mono font-700 text-6xl ${i % 2 === 0 ? 'text-[#0A0B0D]/10' : 'text-white/10'}`}>{step.n}</span>
                <h2 className={`font-display font-800 text-4xl lg:text-5xl leading-tight mb-6 -mt-2 ${i % 2 === 0 ? 'text-[#0A0B0D]' : 'text-white'}`}>
                  {step.title}
                </h2>
                <p className={`text-base leading-relaxed mb-8 ${i % 2 === 0 ? 'text-[#0A0B0D]/50' : 'text-white/50'}`}>
                  {step.body}
                </p>
                <ul className="space-y-3">
                  {step.details.map(d => (
                    <li key={d} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#2F6BFF]/15 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-[#2F6BFF]" />
                      </div>
                      <span className={`text-sm ${i % 2 === 0 ? 'text-[#0A0B0D]/60' : 'text-white/60'}`}>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`relative rounded-3xl overflow-hidden ${i % 2 === 1 ? 'lg:col-start-1' : ''}`} style={{ minHeight: '360px' }}>
                <img
                  src={`https://images.unsplash.com/${step.image}?w=700&h=500&fit=crop&auto=format`}
                  alt={step.title}
                  className="w-full h-full object-cover absolute inset-0"
                />
                <div className={`absolute inset-0 ${i % 2 === 0 ? 'bg-gradient-to-br from-transparent to-[#0A0B0D]/20' : 'bg-gradient-to-br from-transparent to-[#2F6BFF]/20'}`} />
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* FAQ */}
      <section className="py-24 px-6 bg-[#F7F7F5]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-800 text-4xl text-[#0A0B0D] text-center mb-12">Frequently asked</h2>
          <div className="space-y-2">
            {faqs.map(faq => (
              <div key={faq.q} className="border border-[#0A0B0D]/8 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === faq.q ? null : faq.q)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-display font-600 text-sm text-[#0A0B0D]">{faq.q}</span>
                  <ChevronDown size={16} className={`text-[#0A0B0D]/40 transition-transform shrink-0 ml-4 ${openFaq === faq.q ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === faq.q && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-[#0A0B0D]/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/signup" className="btn-primary px-8 py-4 rounded-xl text-base inline-flex items-center gap-2">
              Get started now <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
