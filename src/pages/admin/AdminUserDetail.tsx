import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminUsers } from '../../data/mock';

export default function AdminUserDetail() {
  const { id } = useParams();
  const user = adminUsers.find(u => u.id === id) || adminUsers[0];
  const [balance, setBalance] = useState(user.balance.toString());
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [saved, setSaved] = useState(false);

  const submitAdjustment = () => {
    if (!adjustReason.trim()) return;
    setSaved(true);
    setAdjusting(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const loginHistory = [
    { device: 'Chrome on macOS', ip: '82.45.123.44', location: 'London, UK', date: '2026-09-23 09:42' },
    { device: 'Safari on iPhone', ip: '82.45.123.44', location: 'London, UK', date: '2026-09-22 18:30' },
    { device: 'Chrome on Windows', ip: '185.40.12.66', location: 'Dubai, AE', date: '2026-09-18 14:11' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <Link to="/admin/users" className="flex items-center gap-2 text-xs text-[#C5C8D0]/30 hover:text-[#C5C8D0]/70 mb-6 font-mono">
          <ArrowLeft size={12} /> Back to users
        </Link>
        <h1 className="font-mono font-700 text-xl text-[#C5C8D0] mb-6">{user.name}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Editable fields */}
          <div className="bg-[#0d0f1a] border border-white/5 rounded-xl p-5">
            <h3 className="font-mono text-xs text-[#C5C8D0]/50 uppercase tracking-wider mb-4">User details</h3>
            <div className="space-y-3">
              {[
                { label: 'Name', value: user.name },
                { label: 'Email', value: user.email },
                { label: 'Country', value: user.country },
                { label: 'Signup date', value: user.signupDate, readonly: true },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-[10px] text-[#C5C8D0]/30 mb-1 font-mono">{field.label.toUpperCase()}</label>
                  <input defaultValue={field.value} readOnly={field.readonly}
                    className={`w-full bg-white/3 border border-white/5 rounded-lg px-3 py-2 text-xs text-[#C5C8D0] font-mono outline-none ${
                      field.readonly ? 'opacity-40 cursor-not-allowed' : 'focus:border-[#2F6BFF]/40 transition-colors'
                    }`} />
                </div>
              ))}
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2F6BFF]/15 text-xs text-[#2F6BFF] font-mono hover:bg-[#2F6BFF]/25 transition-colors mt-1">
                <Save size={11} /> Save changes
              </button>
            </div>
          </div>

          {/* Portfolio & balance */}
          <div className="bg-[#0d0f1a] border border-white/5 rounded-xl p-5">
            <h3 className="font-mono text-xs text-[#C5C8D0]/50 uppercase tracking-wider mb-4">Portfolio balances (read-only)</h3>
            <div className="space-y-2 mb-5">
              {[
                { label: 'NFT Proceeds', val: '$21,000' },
                { label: 'Stock Proceeds', val: '$6,485' },
                { label: 'Other Investments', val: '$7,300' },
                { label: 'Cash balance', val: '$33,065' },
              ].map(b => (
                <div key={b.label} className="flex justify-between py-2 border-b border-white/3">
                  <span className="text-xs text-[#C5C8D0]/40 font-mono">{b.label}</span>
                  <span className="text-xs text-[#C5C8D0]/70 font-mono">{b.val}</span>
                </div>
              ))}
            </div>

            {/* Manual balance adjustment */}
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={12} className="text-[#EF4444]" />
                <span className="font-mono text-[10px] text-[#EF4444]">MANUAL BALANCE ADJUSTMENT</span>
              </div>
              {!adjusting ? (
                <button onClick={() => setAdjusting(true)}
                  className="text-xs text-[#EF4444]/60 hover:text-[#EF4444] font-mono transition-colors">
                  Adjust balance (requires reason)
                </button>
              ) : (
                <div className="space-y-2">
                  <input type="number" value={balance} onChange={e => setBalance(e.target.value)}
                    className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2 text-xs text-[#C5C8D0] font-mono outline-none focus:border-[#2F6BFF]/40" />
                  <textarea value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                    placeholder="Required: reason for adjustment (will be logged)"
                    className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2 text-xs text-[#C5C8D0] font-mono outline-none focus:border-[#2F6BFF]/40 resize-none" rows={2} />
                  <div className="flex gap-2">
                    <button onClick={submitAdjustment}
                      disabled={!adjustReason.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#EF4444]/20 text-xs text-[#EF4444] font-mono hover:bg-[#EF4444]/30 disabled:opacity-30 transition-colors">
                      Submit adjustment
                    </button>
                    <button onClick={() => setAdjusting(false)} className="text-xs text-[#C5C8D0]/30 hover:text-[#C5C8D0]/60">
                      Cancel
                    </button>
                  </div>
                  {saved && <p className="text-xs text-[#22C55E] font-mono">Adjustment logged to audit trail</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Login history */}
        <div className="bg-[#0d0f1a] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-mono text-xs text-[#C5C8D0]/50 uppercase tracking-wider">Login history</h3>
            <button className="text-[10px] text-[#2F6BFF]/60 font-mono hover:text-[#2F6BFF]">Export CSV</button>
          </div>
          <div className="divide-y divide-white/3">
            {loginHistory.map((l, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr] px-5 py-3 items-center">
                <span className="text-xs text-[#C5C8D0]/60 font-mono">{l.device}</span>
                <span className="text-xs text-[#C5C8D0]/30 font-mono">{l.ip}</span>
                <span className="text-xs text-[#C5C8D0]/30 font-mono">{l.location}</span>
                <span className="text-xs text-[#C5C8D0]/25 font-mono">{l.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
