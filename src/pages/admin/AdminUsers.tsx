import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminUsers } from '../../data/mock';

const kycFilters = ['All', 'verified', 'pending', 'rejected', 'unverified'];

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('All');

  const filtered = adminUsers.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchKyc = kycFilter === 'All' || u.kyc === kycFilter;
    return matchSearch && matchKyc;
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <h1 className="font-mono font-700 text-xl text-[#C5C8D0] mb-6">Users</h1>

        <div className="flex items-center gap-3 mb-5 flex-col sm:flex-row">
          <div className="flex items-center gap-2 bg-white/3 border border-white/5 rounded-lg px-3 py-2 flex-1">
            <Search size={13} className="text-[#C5C8D0]/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email..."
              className="bg-transparent text-xs text-[#C5C8D0] placeholder-[#C5C8D0]/25 outline-none flex-1 font-mono" />
          </div>
          <div className="flex items-center gap-1">
            {kycFilters.map(f => (
              <button key={f} onClick={() => setKycFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-colors capitalize ${
                  kycFilter === f ? 'bg-[#2F6BFF]/20 text-[#2F6BFF]' : 'text-[#C5C8D0]/30 hover:text-[#C5C8D0]/60 hover:bg-white/3'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0d0f1a] border border-white/5 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-5 py-3 border-b border-white/5">
            {['Name', 'Email', 'KYC', 'Balance', 'Joined'].map(h => (
              <span key={h} className="font-mono text-[10px] text-[#C5C8D0]/30 uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {filtered.map(user => (
            <Link key={user.id} to={`/admin/users/${user.id}`}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-5 py-3 border-b border-white/3 hover:bg-white/2 transition-colors items-center">
              <span className="font-mono text-xs text-[#C5C8D0]/80">{user.name}</span>
              <span className="font-mono text-xs text-[#C5C8D0]/40 truncate">{user.email}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono w-fit ${
                user.kyc === 'verified' ? 'chip-gain' : user.kyc === 'pending' ? 'chip-warning' : 'chip-loss'
              }`}>{user.kyc}</span>
              <span className="font-mono text-xs text-[#C5C8D0]/60">${user.balance.toLocaleString()}</span>
              <span className="font-mono text-xs text-[#C5C8D0]/30">{user.signupDate}</span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-xs text-[#C5C8D0]/25 font-mono">No users match your filter</p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-[#C5C8D0]/20 font-mono mt-3">{filtered.length} users shown</p>
      </div>
    </AdminLayout>
  );
}
