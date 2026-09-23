import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const team = [
  { name: 'Elena Vasquez', role: 'CEO & Co-founder', img: 'photo-1531746020798-e6953c6e8e04', bio: 'Former Goldman Sachs VP. Built 3 fintech startups, 2 acquired.' },
  { name: 'James Osei', role: 'CTO & Co-founder', img: 'photo-1472099645785-5658abf4ff4e', bio: 'Ex-Stripe engineering lead. 12 years in payment infrastructure.' },
  { name: 'Priya Sharma', role: 'Chief Compliance Officer', img: 'photo-1487412720507-e7ab37603c6f', bio: 'Former FCA regulator. Specialist in cross-border financial regulation.' },
  { name: 'Luca Ferrari', role: 'Head of Design', img: 'photo-1463453091185-61582044d556', bio: 'Previously Figma and Monzo. Built interfaces for 50M+ users.' },
];

const milestones = [
  { year: '2022', event: 'IndySolutions founded in London' },
  { year: '2023', event: 'FCA registration approved · First 10,000 users' },
  { year: '2024', event: 'Series A ($24M) · DFSA license (Dubai) · 5 languages launched' },
  { year: '2025', event: '100,000 users · $1B AUM milestone · Space Economy stocks launched' },
  { year: '2026', event: '147,000 users · $2.4B assets · SEC registration filed' },
];

export default function About() {
  return (
    <div className="bg-[#F7F7F5]">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-[#0A0B0D]">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-4">About</p>
          <h1 className="font-display font-800 text-6xl lg:text-8xl text-white leading-[0.9] tracking-tight mb-8 max-w-3xl">
            Built to give everyone access.
          </h1>
          <p className="text-white/40 text-lg leading-relaxed max-w-xl">
            IndySolutions was founded on a simple belief: the best investment infrastructure shouldn't be reserved for institutional players. We're changing that.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display font-800 text-4xl text-[#0A0B0D] mb-6">Our mission</h2>
              <p className="text-[#0A0B0D]/60 text-base leading-relaxed mb-6">
                We believe access to diversified investment — across asset classes that used to require separate brokers, minimum accounts, and institutional introductions — should be a right, not a privilege.
              </p>
              <p className="text-[#0A0B0D]/60 text-base leading-relaxed">
                One account. Three asset classes. Transparent fees. Real-time data. A platform that respects your intelligence enough to show you every fee before you pay it.
              </p>
            </div>
            <div className="relative h-80 lg:h-96">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&h=500&fit=crop&auto=format"
                alt="Team working"
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-6 bg-[#0A0B0D]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display font-800 text-4xl text-white mb-16 text-center">Milestones</h2>
          <div className="relative">
            <div className="absolute left-16 top-0 bottom-0 w-px bg-gradient-to-b from-[#2F6BFF] to-[#2F6BFF]/10" />
            <div className="space-y-8">
              {milestones.map(m => (
                <div key={m.year} className="flex gap-8 items-start">
                  <span className="font-mono font-700 text-sm text-[#2F6BFF] w-12 shrink-0 pt-0.5">{m.year}</span>
                  <div className="w-3 h-3 rounded-full bg-[#2F6BFF] shrink-0 mt-1.5 relative z-10 ring-4 ring-[#0A0B0D]" />
                  <p className="text-white/60 text-sm leading-relaxed pt-0.5">{m.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display font-800 text-4xl text-[#0A0B0D] mb-16 text-center">Leadership team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map(member => (
              <div key={member.name} className="text-center">
                <div className="relative mb-5">
                  <img
                    src={`https://images.unsplash.com/${member.img}?w=200&h=200&fit=crop&crop=face&auto=format`}
                    alt={member.name}
                    className="w-full aspect-square object-cover rounded-2xl"
                  />
                </div>
                <h3 className="font-display font-700 text-base text-[#0A0B0D]">{member.name}</h3>
                <p className="text-xs text-[#2F6BFF] font-medium mt-1">{member.role}</p>
                <p className="text-xs text-[#0A0B0D]/40 mt-2 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers CTA */}
      <section id="careers" className="py-24 px-6 bg-[#0A0B0D]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-800 text-4xl text-white mb-6">Join us</h2>
          <p className="text-white/40 text-base leading-relaxed mb-8">
            We're a team of 42 across London, Dubai, and São Paulo. We're hiring engineers, designers, compliance specialists, and operations leads.
          </p>
          <Link to="/contact" className="btn-primary px-8 py-4 rounded-xl text-base inline-flex items-center gap-2">
            View open roles <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
