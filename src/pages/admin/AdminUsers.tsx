import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, Users as UsersIcon } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminUsers } from '../../data/mock';
import { fetchSharedUsers } from '../../lib/notes';
import { deletedEmails } from '../../lib/userRecords';

const kycFilters = ['All', 'verified', 'pending', 'rejected', 'unverified'];

interface SharedUser {
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
  logins: { account: string; name: string; method: string; at: string }[];
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('All');
  const [shared, setShared] = useState<SharedUser[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState('');

  const load = async () => {
    setShared(await fetchSharedUsers());
    setLastSync(new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };
  useEffect(() => {
    void load();
    const onLogin = () => void load();
    window.addEventListener('indy-logins', onLogin);
    window.addEventListener('storage', onLogin);
    return () => {
      window.removeEventListener('indy-logins', onLogin);
      window.removeEventListener('storage', onLogin);
    };
  }, []);

  const sharedEmails = new Set(shared.map(s => s.email.toLowerCase()));
  void sharedEmails;
  const hidden = new Set(deletedEmails().map(e => e.toLowerCase()));
  const filtered = adminUsers.filter(u => !hidden.has(u.email.toLowerCase())).filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchKyc = kycFilter === 'All' || u.kyc === kycFilter;
    return matchSearch && matchKyc;
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-mono font-700 text-xl text-[#0A0B0D]">Users</h1>
          <button onClick={() => void load()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/8 text-[11px] text-black/40 hover:text-black/70 transition-colors font-mono">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {/* Real signups + full login history (shared DB when configured). */}
        <div className="bg-white border border-black/5 rounded-xl overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
            <h2 className="font-mono text-sm text-black/70 flex items-center gap-2">
              <UsersIcon size={14} /> Signed-up users
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] font-mono">{shared.length}</span>
            </h2>
            {lastSync && (
              <span className="text-[10px] text-black/30 font-mono">
                live · updated {lastSync}
              </span>
            )}
          </div>
          {shared.length === 0 ? (
            <p className="px-5 py-8 text-xs text-black/30 text-center font-mono">
              No sign-ups recorded yet. Every signup and login on any device appears here with its full timestamped history.
            </p>
          ) : (
            <div className="divide-y divide-black/5">
              {shared
                .filter(s => !hidden.has(s.email.toLowerCase()))
                .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
                .map(s => (
                <div key={s.email}>
                  <button onClick={() => setExpanded(e => (e === s.email ? null : s.email))}
                    className="w-full grid grid-cols-[2fr_2fr_1fr_1fr] px-5 py-3 hover:bg-black/2 transition-colors items-center text-left">
                    <span className="font-mono text-xs text-black/80 truncate">{s.name}</span>
                    <span className="font-mono text-xs text-black/40 truncate">{s.email}</span>
                    <span className="font-mono text-xs text-black/60">{s.loginCount} login{s.loginCount === 1 ? '' : 's'}</span>
                    <span className="font-mono text-xs text-black/30">
                      {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </button>
                  {expanded === s.email && (
                    <div className="px-5 pb-4">
                      <Link to={`/admin/users/${encodeURIComponent(s.email)}`}
                        className="mb-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2F6BFF]/15 text-[11px] text-[#2F6BFF] font-mono hover:bg-[#2F6BFF]/25 transition-colors">
                        Manage this account
                      </Link>
                      <div className="rounded-lg bg-black/2 border border-black/5 overflow-hidden">
                        {s.logins.map((l, i) => (
                          <div key={`${l.at}-${i}`} className="flex items-center gap-3 px-4 py-2 border-b border-black/5 last:border-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-black/50 font-mono">{l.method}</span>
                            <span className="font-mono text-[11px] text-black/60">{new Date(l.at).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <h2 className="font-mono text-sm text-black/50 mb-3">Demo directory</h2>

        <div className="flex items-center gap-3 mb-5 flex-col sm:flex-row">
          <div className="flex items-center gap-2 bg-black/3 border border-black/5 rounded-lg px-3 py-2 flex-1">
            <Search size={13} className="text-black/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="bg-transparent text-xs text-[#0A0B0D] placeholder-[#C5C8D0]/25 outline-none flex-1 font-mono" />
          </div>
          <div className="flex items-center gap-1">
            {kycFilters.map(f => (
              <button key={f} onClick={() => setKycFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-colors capitalize ${
                  kycFilter === f ? 'bg-[#2F6BFF]/20 text-[#2F6BFF]' : 'text-black/30 hover:text-black/60 hover:bg-black/3'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-black/5 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-5 py-3 border-b border-black/5">
            {['Name', 'Email', 'KYC', 'Balance', 'Joined'].map(h => (
              <span key={h} className="font-mono text-[10px] text-black/30 uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {filtered.map(user => (
            <Link key={user.id} to={`/admin/users/${user.id}`}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-5 py-3 border-b border-black/3 hover:bg-black/2 transition-colors items-center">
              <span className="font-mono text-xs text-black/80">{user.name}</span>
              <span className="font-mono text-xs text-black/40 truncate">{user.email}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono w-fit ${
                user.kyc === 'verified' ? 'chip-gain' : user.kyc === 'pending' ? 'chip-warning' : 'chip-loss'
              }`}>{user.kyc}</span>
              <span className="font-mono text-xs text-black/60">${user.balance.toLocaleString()}</span>
              <span className="font-mono text-xs text-black/30">{user.signupDate}</span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs text-black/25 font-mono">No users match your filter</p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-black/20 font-mono mt-3">{filtered.length} users shown</p>
      </div>
    </AdminLayout>
  );
}
