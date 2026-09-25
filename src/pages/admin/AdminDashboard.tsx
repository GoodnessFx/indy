import AdminLayout from './AdminLayout';
import { MessageSquare, Clock, BellRing, CreditCard, LogIn } from 'lucide-react';
import { adminUsers } from '../../data/mock';
import { adminOrderFeed } from '../../lib/orders';
import { useOrdersSync } from '../../lib/useOrdersSync';
import { loginFeed, scanFeed } from '../../lib/audit';
import { useEffect, useState } from 'react';

const activity = [
  { action: 'KYC approved', user: 'Marcus Chen', time: '2m ago', type: 'success' },
  { action: 'New user registered', user: 'Fatima Al-Rashid', time: '5m ago', type: 'info' },
  { action: 'Large withdrawal flagged', user: '$45,000 withdrawal', time: '12m ago', type: 'warning' },
  { action: 'KYC rejected', user: 'Raj Krishnamurthy', time: '25m ago', type: 'error' },
  { action: 'Support ticket escalated', user: 'TK-2841', time: '1h ago', type: 'warning' },
  { action: 'New user registered', user: 'Lena Muller', time: '2h ago', type: 'info' },
];

export default function AdminDashboard() {
  const [feed] = useOrdersSync(() => adminOrderFeed());
  const pending = feed.filter(o => o.status === 'pending');
  const recent = feed.slice(0, 5);
  const [logins, setLogins] = useState(() => loginFeed());
  const [scans, setScans] = useState(() => scanFeed());

  useEffect(() => {
    const syncLogins = () => setLogins(loginFeed());
    const syncScans = () => setScans(scanFeed());
    window.addEventListener('indy-logins', syncLogins);
    window.addEventListener('indy-scans', syncScans);
    window.addEventListener('storage', syncLogins);
    window.addEventListener('storage', syncScans);
    return () => {
      window.removeEventListener('indy-logins', syncLogins);
      window.removeEventListener('indy-scans', syncScans);
      window.removeEventListener('storage', syncLogins);
      window.removeEventListener('storage', syncScans);
    };
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-mono font-700 text-xl text-[#0A0B0D]">Dashboard</h1>
            <p className="text-xs text-black/30 mt-1 font-mono">{new Date().toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
            <span className="text-xs text-black/30 font-mono">All systems operational</span>
          </div>
        </div>

        {/* Quick stats pulled from real activity */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <p className="font-mono font-700 text-2xl text-[#0A0B0D]">{logins.length}</p>
            <p className="text-[10px] text-black/30 mt-1 font-mono">Sign-ins today</p>
          </div>
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <p className="font-mono font-700 text-2xl text-[#F59E0B]">{pending.length}</p>
            <p className="text-[10px] text-black/30 mt-1 font-mono">Pending investments</p>
          </div>
          <div className="bg-white border border-black/5 rounded-xl p-4">
            <p className="font-mono font-700 text-2xl text-[#2F6BFF]">{scans.length}</p>
            <p className="text-[10px] text-black/30 mt-1 font-mono">Card scans captured</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investment orders, clients land here the second they submit */}
          <div className="bg-white border border-black/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <h2 className="font-mono text-sm text-black/70 flex items-center gap-2">
                <BellRing size={14} className="text-[#F59E0B]" /> Investment orders
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-mono">
                {pending.length} pending
              </span>
            </div>
            <div className="divide-y divide-black/5">
              {recent.length === 0 && (
                <p className="px-5 py-6 text-xs text-black/30 font-mono">
                  No client orders yet. New investments appear here instantly.
                </p>
              )}
              {recent.map(o => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${o.status === 'active' ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-black/70 truncate">{o.assetName}, <span className="text-black/40">{o.account}</span></p>
                    <p className="text-[10px] text-black/25 font-mono">{o.currency} {o.amount.toLocaleString()} · {o.status}</p>
                  </div>
                  <span className="text-[10px] text-black/25 font-mono shrink-0">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Login activity, every client sign in with time */}
          <div className="bg-white border border-black/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <h2 className="font-mono text-sm text-black/70 flex items-center gap-2">
                <LogIn size={14} className="text-[#2F6BFF]" /> Login activity
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] font-mono">
                {logins.length}
              </span>
            </div>
            <div className="divide-y divide-black/5 max-h-64 overflow-y-auto">
              {logins.length === 0 && (
                <p className="px-5 py-6 text-xs text-black/30 font-mono">
                  No sign ins yet. Every client login is recorded here with its time.
                </p>
              )}
              {logins.map(l => (
                <div key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-lg bg-[#2F6BFF]/10 flex items-center justify-center shrink-0">
                    {l.method === 'google'
                      ? <svg width="13" height="13" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.8 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.2-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.8 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.7-.2-3.9z"/></svg>
                      : <span className="font-mono text-[9px] text-[#2F6BFF]">@</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-black/70 truncate">{l.name} <span className="text-black/35">({l.email})</span></p>
                    <p className="text-[10px] text-black/25 font-mono">{l.method.toUpperCase()}</p>
                  </div>
                  <span className="text-[10px] text-black/30 font-mono shrink-0">
                    {new Date(l.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scanned cards, pictures captured in the card scanner go here */}
          <div className="bg-white border border-black/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <h2 className="font-mono text-sm text-black/70 flex items-center gap-2">
                <CreditCard size={14} className="text-[#F59E0B]" /> Scanned cards
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-mono">
                {scans.length}
              </span>
            </div>
            {scans.length === 0 ? (
              <p className="px-5 py-6 text-xs text-black/30 font-mono">
                No card scans yet. When a client scans a card, the capture lands here.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 p-4 gap-3">
                {scans.map(s => (
                  <div key={s.id} className="rounded-xl border border-black/5 overflow-hidden bg-black/2">
                    <div className="grid grid-cols-2 gap-1 p-1 bg-[#0d1020]">
                      {(s.images && s.images.length > 0 ? s.images : [s.image]).slice(0, 2).map((src, i) => (
                        <div key={i} className="aspect-[16/9] overflow-hidden relative">
                          <img src={src} alt={i === 0 ? 'Card front' : 'Card back'} className="w-full h-full object-cover opacity-90" loading="lazy" />
                          <span className="absolute top-1 left-1 text-[9px] px-2 py-0.5 rounded-full bg-black/55 text-white font-mono">
                            {i === 0 ? 'Front' : 'Back'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-[11px] text-black/70 font-medium truncate">{s.label}, ···· {s.last4}</p>
                      <p className="text-[10px] text-black/30 font-mono truncate">{s.account}</p>
                      <p className="text-[9px] text-black/25 font-mono">{new Date(s.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-white border border-black/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5">
              <h2 className="font-mono text-sm text-black/70">Recent activity</h2>
            </div>
            <div className="divide-y divide-black/5">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    a.type === 'success' ? 'bg-[#22C55E]' :
                    a.type === 'warning' ? 'bg-[#F59E0B]' :
                    a.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#2F6BFF]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-black/70 truncate">{a.action}, <span className="text-black/40">{a.user}</span></p>
                  </div>
                  <span className="text-[10px] text-black/25 font-mono shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent users */}
          <div className="bg-white border border-black/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
              <h2 className="font-mono text-sm text-black/70">Recent users</h2>
              <a href="/admin/users" className="text-[10px] text-[#2F6BFF] font-mono">View all</a>
            </div>
            <div className="divide-y divide-black/5">
              {adminUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-lg bg-[#2F6BFF]/10 flex items-center justify-center shrink-0">
                    <span className="font-mono text-[10px] text-[#2F6BFF]">{user.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-black/70 truncate">{user.name}</p>
                    <p className="text-[10px] text-black/25 font-mono">{user.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    user.kyc === 'verified' ? 'chip-gain' :
                    user.kyc === 'pending' ? 'chip-warning' : 'chip-loss'
                  }`}>{user.kyc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
