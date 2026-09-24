import AdminLayout from './AdminLayout';
import { Users, DollarSign, ShieldAlert, MessageSquare, Clock, TrendingUp, BellRing } from 'lucide-react';
import { adminUsers } from '../../data/mock';
import { adminOrderFeed } from '../../lib/orders';
import { useOrdersSync } from '../../lib/useOrdersSync';

const kpis = [
  { label: 'Total Users', value: '147,243', change: '+284 this week', icon: Users, color: 'text-[#2F6BFF]', bg: 'bg-[#2F6BFF]/10' },
  { label: 'Total AUM', value: '$2.4B', change: '+$12.4M today', icon: DollarSign, color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' },
  { label: 'Pending KYC', value: '38', change: '12 urgent', icon: ShieldAlert, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
  { label: 'Open Tickets', value: '124', change: '8 unassigned', icon: MessageSquare, color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10' },
  { label: 'Pending Withdrawals', value: '47', change: '$284,000 total', icon: Clock, color: 'text-[#2F6BFF]', bg: 'bg-[#2F6BFF]/10' },
];

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
  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-mono font-700 text-xl text-[#0A0B0D]">Dashboard</h1>
            <p className="text-xs text-black/30 mt-1 font-mono">Sep 23, 2026, 09:42 UTC</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
            <span className="text-xs text-black/30 font-mono">All systems operational</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {kpis.map(kpi => (
            <div key={kpi.label} className="bg-white border border-black/5 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                <kpi.icon size={14} className={kpi.color} />
              </div>
              <p className="font-mono font-700 text-lg text-[#0A0B0D]">{kpi.value}</p>
              <p className="text-[10px] text-black/30 mt-0.5 font-mono">{kpi.label}</p>
              <p className="text-[10px] text-black/20 mt-1">{kpi.change}</p>
            </div>
          ))}
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
