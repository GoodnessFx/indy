import { useState } from 'react';
import { Lock, Shield, Database, FileText, ChevronDown, BadgeCheck } from 'lucide-react';

const sections = [
  {
    icon: Lock,
    title: 'Encryption & Data Protection',
    summary: 'AES-256 at rest, TLS 1.3 in transit, Zero-knowledge storage for credentials',
    content: 'All data at rest is encrypted using AES-256. All data in transit uses TLS 1.3 with modern cipher suites. We employ a zero-knowledge model for passwords, only cryptographic hashes are stored, never plaintext. Encryption keys are managed using HSMs (Hardware Security Modules) and rotated quarterly.',
  },
  {
    icon: Shield,
    title: 'Custody & Asset Safety',
    summary: 'Segregated accounts, Third-party custody, Qualified custodian',
    content: 'Client funds are held in segregated accounts with our licensed banking partner, separate from IndySolutions operating funds. Digital assets are custodied by a qualified custodian meeting SOC 2 Type II requirements. Custodied assets carry insurance coverage for qualified amounts.',
  },
  {
    icon: Database,
    title: 'KYC / AML Compliance',
    summary: 'Global watchlist screening, Document verification, Ongoing monitoring',
    content: 'Every user is screened against global PEP (Politically Exposed Persons), sanctions, and adverse media watchlists during onboarding and on an ongoing basis. Document verification is powered by our licensed compliance partner. Suspicious activity is reported as required by applicable law.',
  },
  {
    icon: FileText,
    title: 'Regulatory Status',
    summary: 'FCA registered, DFSA regulated, SEC-registered investment adviser',
    content: 'Indy Digital Marketing Solutions Ltd is registered with the UK Financial Conduct Authority (FCA). Our MENA operations are regulated by the Dubai Financial Services Authority (DFSA). US investment advisory services are registered with the SEC. Licensing details are available on each regulatory body\'s public register.',
  },
];

const partners = [
  { name: 'Stripe', role: 'Payment processing', logo: 'S' },
  { name: 'Fireblocks', role: 'Digital asset custody', logo: 'F' },
  { name: 'Onfido', role: 'KYC & identity', logo: 'O' },
  { name: 'AWS', role: 'Infrastructure', logo: 'A' },
];

export default function SecurityTrust() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="bg-[#F7F7F5] min-h-screen">
      {/* Header */}
      <div className="pt-32 pb-16 px-6 bg-[#F7F7F5]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-end">
            <div className="lg:col-span-2">
              <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-4">Trust Report</p>
              <h1 className="font-display font-800 text-5xl lg:text-6xl text-[#0A0B0D] leading-tight mb-6">
                Security &<br />Trust
              </h1>
              <p className="text-black/40 text-base leading-relaxed max-w-xl">
                How we protect your assets, your identity, and your money. Read the actual policies, not the marketing copy.
              </p>
            </div>
            {/* Summary badges */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'AES-256', desc: 'Encryption' },
                { label: 'KYC/AML', desc: 'Verified' },
                { label: 'FCA', desc: 'Regulated' },
                { label: 'SOC 2', desc: 'Certified' },
              ].map(b => (
                <div key={b.label} className="p-4 rounded-xl border border-black/8 bg-black/3">
                  <p className="font-mono font-700 text-lg text-[#2F6BFF]">{b.label}</p>
                  <p className="text-xs text-black/30 mt-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {/* Expandable sections */}
        <div className="space-y-3 mb-16">
          {sections.map(section => (
            <div key={section.title} className="bg-white rounded-2xl border border-[#0A0B0D]/6 overflow-hidden">
              <button
                onClick={() => setOpen(open === section.title ? null : section.title)}
                className="w-full flex items-start justify-between p-6 text-left"
              >
                <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-xl bg-[#2F6BFF]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <section.icon size={18} className="text-[#2F6BFF]" />
                  </div>
                  <div>
                    <h3 className="font-display font-700 text-lg text-[#0A0B0D]">{section.title}</h3>
                    <p className="text-sm text-[#0A0B0D]/40 mt-1">{section.summary}</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-[#0A0B0D]/30 shrink-0 mt-1 transition-transform ${open === section.title ? 'rotate-180' : ''}`} />
              </button>
              {open === section.title && (
                <div className="px-6 pb-6 ml-15">
                  <div className="ml-15 border-t border-[#0A0B0D]/5 pt-5" style={{ marginLeft: '60px' }}>
                    <p className="text-sm text-[#0A0B0D]/60 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Licensed partners */}
        <div className="mb-16">
          <h2 className="font-display font-700 text-2xl text-[#0A0B0D] mb-8">Licensed Partners</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {partners.map(p => (
              <div key={p.name} className="bg-white rounded-2xl border border-[#0A0B0D]/6 p-5 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#F7F7F5]/5 flex items-center justify-center font-display font-800 text-lg text-[#0A0B0D]">{p.logo}</div>
                <div>
                  <p className="font-display font-600 text-sm text-[#0A0B0D]">{p.name}</p>
                  <p className="text-xs text-[#0A0B0D]/40 mt-0.5">{p.role}</p>
                </div>
                <div className="flex items-center gap-1 text-[#22C55E]">
                  <BadgeCheck size={12} />
                  <span className="text-[10px]">Licensed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsible disclosure */}
        <div className="bg-[#F7F7F5] rounded-2xl p-8">
          <h3 className="font-display font-700 text-xl text-[#0A0B0D] mb-3">Responsible Disclosure</h3>
          <p className="text-black/40 text-sm leading-relaxed mb-5">
            Found a security vulnerability? We take all reports seriously and respond within 48 hours. We offer recognition for valid critical disclosures.
          </p>
          <a href="mailto:security@indysolutions.com" className="text-[#2F6BFF] text-sm hover:text-[#4F82FF] transition-colors font-mono">
            security@indysolutions.com
          </a>
        </div>
      </div>
    </div>
  );
}
