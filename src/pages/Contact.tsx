import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Check, MessageCircle } from 'lucide-react';

const regions = [
  { region: 'London (HQ)', email: 'support@indysolutions.com', phone: '+44 20 1234 5678', hours: 'Mon to Fri 09:00 to 18:00 GMT' },
  { region: 'Dubai', email: 'mena@indysolutions.com', phone: '+971 4 123 4567', hours: 'Sun to Thu 09:00 to 17:00 GST' },
  { region: 'Sao Paulo', email: 'latam@indysolutions.com', phone: '+55 11 1234-5678', hours: 'Mon to Fri 09:00 to 18:00 BRT' },
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="bg-[#F7F7F5] min-h-screen">
      <div className="pt-32 pb-16 px-6 bg-[#F7F7F5]">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-4">Get in touch</p>
          <h1 className="font-display font-800 text-5xl lg:text-6xl text-[#0A0B0D] mb-6">Contact us</h1>
          <p className="text-black/40 text-base max-w-lg">We respond to every message. Support tickets typically receive a reply within 3 hours during business hours.</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact form */}
          <div>
            <h2 className="font-display font-700 text-2xl text-[#0A0B0D] mb-8">Send a message</h2>
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 border-2 border-[#22C55E]/30 flex items-center justify-center mb-6">
                  <Check size={28} className="text-[#22C55E]" />
                </div>
                <h3 className="font-display font-700 text-xl text-[#0A0B0D] mb-2">Message sent!</h3>
                <p className="text-[#0A0B0D]/50 text-sm">We'll reply within 3 hours during business hours.</p>
                <button onClick={() => setSent(false)} className="mt-6 text-sm text-[#2F6BFF] hover:text-[#4F82FF]">Send another</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'name', label: 'Full name', placeholder: 'Marcus Chen', type: 'text' },
                    { key: 'email', label: 'Email', placeholder: 'marcus@example.com', type: 'email' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-[#0A0B0D]/40 mb-2">{f.label}</label>
                      <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => update(f.key, e.target.value)}
                        placeholder={f.placeholder} required
                        className="w-full bg-white border border-[#0A0B0D]/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] placeholder-[#0A0B0D]/25 outline-none focus:border-[#2F6BFF] transition-colors" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-[#0A0B0D]/40 mb-2">Subject</label>
                  <select value={form.subject} onChange={e => update('subject', e.target.value)} required
                    className="w-full bg-white border border-[#0A0B0D]/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none cursor-pointer focus:border-[#2F6BFF] transition-colors">
                    <option value="">Select a topic</option>
                    {['Account & Verification', 'Deposits & Withdrawals', 'NFT Marketplace', 'Stock Trading', 'Alternative Investments', 'Technical Issue', 'Partnership inquiry', 'Press & Media', 'Other'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#0A0B0D]/40 mb-2">Message</label>
                  <textarea value={form.message} onChange={e => update('message', e.target.value)}
                    placeholder="Describe your question or issue in detail..." rows={5} required
                    className="w-full bg-white border border-[#0A0B0D]/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] placeholder-[#0A0B0D]/25 outline-none focus:border-[#2F6BFF] transition-colors resize-none" />
                </div>
                <button type="submit" className="btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2">
                  <Send size={15} /> Send message
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-8">
            {/* Live chat entry */}
            <div id="chat" className="bg-[#F7F7F5] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#2F6BFF]/15 flex items-center justify-center">
                  <MessageCircle size={18} className="text-[#2F6BFF]" />
                </div>
                <div>
                  <p className="font-display font-600 text-base text-[#0A0B0D]">Live chat support</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
                    <span className="text-xs text-[#22C55E]">Online now, 3 min wait</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-black/40 mb-4">Start a live chat for immediate assistance. Available during business hours.</p>
              <button className="btn-primary px-5 py-3 rounded-xl text-sm w-full">Open live chat</button>
            </div>

            {/* Regional offices */}
            <div>
              <h3 className="font-display font-700 text-lg text-[#0A0B0D] mb-5">Regional support</h3>
              <div className="space-y-4">
                {regions.map(r => (
                  <div key={r.region} className="bg-white rounded-2xl border border-[#0A0B0D]/6 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin size={13} className="text-[#2F6BFF]" />
                      <span className="font-display font-600 text-sm text-[#0A0B0D]">{r.region}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[#0A0B0D]/50">
                        <Mail size={11} />
                        <a href={`mailto:${r.email}`} className="hover:text-[#2F6BFF] transition-colors">{r.email}</a>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#0A0B0D]/50">
                        <Phone size={11} />
                        <span>{r.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#0A0B0D]/50">
                        <Clock size={11} />
                        <span>{r.hours}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
