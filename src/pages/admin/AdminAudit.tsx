import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { auditLog } from '../../data/mock';

export default function AdminAudit() {
  const [adminFilter, setAdminFilter] = useState('All');

  const admins = ['All', ...Array.from(new Set(auditLog.map(e => e.admin)))];
  const filtered = auditLog.filter(e => adminFilter === 'All' || e.admin === adminFilter);

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-mono font-700 text-xl text-[#C5C8D0]">Audit Log</h1>
            <p className="text-xs text-[#C5C8D0]/30 font-mono mt-1">Immutable log of all admin actions</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5 text-xs text-[#C5C8D0]/40 font-mono hover:text-[#C5C8D0]/70 transition-colors">
            <Download size={11} /> Export
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Filter size={11} className="text-[#C5C8D0]/30" />
          {admins.map(a => (
            <button key={a} onClick={() => setAdminFilter(a)}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                adminFilter === a ? 'bg-[#2F6BFF]/15 text-[#2F6BFF]' : 'text-[#C5C8D0]/25 hover:text-[#C5C8D0]/50 hover:bg-white/3'
              }`}>
              {a === 'All' ? 'All admins' : a.split('@')[0]}
            </button>
          ))}
        </div>

        <div className="bg-[#0d0f1a] border border-white/5 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr] px-5 py-3 border-b border-white/5">
            {['Admin', 'Action', 'Target', 'Before', 'After', 'Timestamp'].map(h => (
              <span key={h} className="font-mono text-[9px] text-[#C5C8D0]/25 uppercase tracking-wider">{h}</span>
            ))}
          </div>
          {filtered.map(entry => (
            <div key={entry.id} className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr] px-5 py-3 border-b border-white/3 items-center hover:bg-white/1 transition-colors">
              <span className="font-mono text-[10px] text-[#C5C8D0]/40 truncate">{entry.admin.split('@')[0]}</span>
              <span className="font-mono text-[10px] text-[#C5C8D0]/70">{entry.action}</span>
              <span className="font-mono text-[10px] text-[#C5C8D0]/40 truncate">{entry.target}</span>
              <span className="font-mono text-[10px] text-[#EF4444]/50 truncate">{entry.before}</span>
              <span className="font-mono text-[10px] text-[#22C55E]/60 truncate">{entry.after}</span>
              <span className="font-mono text-[9px] text-[#C5C8D0]/20">{new Date(entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
