import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, ShieldCheck, FileText, LogOut, TrendingUp } from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/kyc', label: 'KYC Queue', icon: ShieldCheck },
  { to: '/admin/support', label: 'Support Inbox', icon: MessageSquare },
  { to: '/admin/audit', label: 'Audit Log', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen admin-surface flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-black/5 flex flex-col">
        <div className="px-4 py-5 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2F6BFF]/20 flex items-center justify-center">
              <TrendingUp size={13} className="text-[#2F6BFF]" />
            </div>
            <span className="font-mono text-xs text-black/60">Admin Console</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono transition-colors ${
                location.pathname === to
                  ? 'bg-[#2F6BFF]/15 text-[#2F6BFF]'
                  : 'text-black/50 hover:text-[#0A0B0D] hover:bg-black/3'
              }`}>
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-black/5">
          <button onClick={() => navigate('/admin')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono text-black/30 hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors w-full">
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
