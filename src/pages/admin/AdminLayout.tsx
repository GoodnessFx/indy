import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, ShieldCheck, FileText, LogOut, TrendingUp, BellRing, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import { totalUnreadForAdmin, conversations } from '../../lib/notes';
import { signOutEverywhere } from '../../lib/supabase';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/kyc', label: 'KYC Queue', icon: ShieldCheck },
  { to: '/admin/support', label: 'Support Inbox', icon: MessageSquare },
  { to: '/admin/notifications', label: 'Notifications', icon: BellRing },
  { to: '/admin/audit', label: 'Audit Log', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Desktop rail collapse, plus a mobile drawer that closes on navigation.
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [location.pathname]);

  const unread = totalUnreadForAdmin();
  const convoCount = conversations().length;
  const rail = collapsed;

  const items = navItems.map(item => {
    let badge: number | null = null;
    if (item.to === '/admin/support') badge = unread > 0 ? unread : convoCount > 0 ? convoCount : null;
    return { ...item, badge };
  });

  return (
    <div className="min-h-screen admin-surface flex">
      {/* Mobile backdrop */}
      {drawer && (
        <div className="fixed inset-0 bg-black/45 z-40 lg:hidden" onClick={() => setDrawer(false)} aria-hidden="true" />
      )}

      {/* Sidebar: rail on desktop when collapsed, drawer on mobile */}
      <aside
        className={`${
          rail ? 'lg:w-16' : 'lg:w-56'
        } w-60 shrink-0 bg-white border-r border-black/5 flex flex-col fixed lg:static inset-y-0 left-0 z-50 transition-all duration-200 ${
          drawer ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 py-4 border-b border-black/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#2F6BFF]/20 flex items-center justify-center shrink-0">
              <TrendingUp size={13} className="text-[#2F6BFF]" />
            </div>
            {!rail && <span className="font-mono text-xs text-black/60 truncate">Admin Console</span>}
          </div>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:block text-black/30 hover:text-black/60 transition-colors"
            aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {rail ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
          <button
            onClick={() => setDrawer(false)}
            className="lg:hidden text-black/30 hover:text-black/60 transition-colors"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {items.map(({ to, label, icon: Icon, badge }) => (
            <Link key={to} to={to} title={label}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono transition-colors ${
                location.pathname === to
                  ? 'bg-[#2F6BFF]/15 text-[#2F6BFF]'
                  : 'text-black/50 hover:text-[#0A0B0D] hover:bg-black/3'
              } ${rail ? 'lg:justify-center lg:px-0' : ''}`}>
              <Icon size={13} className="shrink-0" />
              {!rail && <span className="truncate">{label}</span>}
              {!rail && badge ? (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-[#2F6BFF] text-white">{badge}</span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-black/5">
          <button onClick={() => void signOutEverywhere(navigate)} title="Sign out"
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono text-black/30 hover:text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors w-full ${rail ? 'lg:justify-center lg:px-0' : ''}`}>
            <LogOut size={13} />
            {!rail && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-auto p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => setDrawer(true)}
          className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-black/10 bg-white text-xs font-mono text-black/60"
        >
          <Menu size={14} /> Menu
        </button>
        <div className="min-w-0">{children}</div>
      </main>
    </div>
  );
}