import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, Bell, Menu, X, TrendingUp, ChevronDown, LogOut, Settings, LayoutDashboard, Check } from 'lucide-react';
import { languages } from '../data/mock';
import Logo from './Logo';
import ConnectWallet from './ConnectWallet';
import { useAuth } from '../lib/useAuth';
import { myOrders } from '../lib/orders';
import { getTriggers } from '../lib/watchlist';
import { userNotes, broadcasts, markUserNotesRead, markBroadcastsRead } from '../lib/notes';
import { useOrdersSync } from '../lib/useOrdersSync';

interface NavProps {
  isAuthenticated?: boolean;
}

export default function Nav({ isAuthenticated = false }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(languages[0]);
  const { profile } = useAuth();
  const accountName = profile?.name || profile?.email || 'Account';
  const accountEmail = profile?.email || '';
  const accountInitial = (profile?.name || profile?.email || 'A').trim().charAt(0).toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();

  // Site base is white. Nav text stays dark on every surface so scrolling
  // never hides it. Only the hero panels below render dark imagery.
  const isLight = true;
  const isDark = false;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navLinks = isAuthenticated
    ? [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'NFTs', to: '/nfts' },
        { label: 'Stocks', to: '/stocks' },
        { label: 'Investments', to: '/investments' },
        { label: 'Vehicles', to: '/vehicles' },
      ]
    : [
        { label: 'NFTs', to: '/nfts' },
        { label: 'Stocks', to: '/stocks' },
        { label: 'Investments', to: '/investments' },
        { label: 'Vehicles', to: '/vehicles' },
        { label: 'How It Works', to: '/how-it-works' },
        { label: 'Pricing', to: '/pricing' },
      ];

  const textColor = scrolled || !isDark ? (isDark ? 'text-[#0A0B0D]' : 'text-[#0A0B0D]') : 'text-[#0A0B0D]';
  const navBg = scrolled
    ? isDark ? 'bg-[#F7F7F5]/95 backdrop-blur-xl border-b border-black/5' : 'bg-[#F7F7F5]/95 backdrop-blur-xl border-b border-black/5'
    : 'bg-transparent';

  // Notifications are built from this account's own activity: admin
  // broadcasts, in-app notes (uploads, scans), pending investments, and
  // triggered price alerts. A new account sees nothing to read.
  const [orders] = useOrdersSync(() => myOrders());
  const [triggers] = useOrdersSync(() => getTriggers());
  const [notes] = useOrdersSync(() => userNotes());
  const [bcast] = useOrdersSync(() => broadcasts());
  const notifications = [
    ...bcast.map(b => ({
      id: b.id,
      text: `${b.title}: ${b.body}`,
      time: new Date(b.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      read: false,
    })),
    ...notes.map(n => ({
      id: n.id,
      text: n.text,
      time: new Date(n.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      read: false,
    })),
    ...orders.filter(o => o.status === 'pending').map(o => ({
      id: o.id,
      text: `${o.assetName} is awaiting payment`,
      time: new Date(o.createdAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      read: false,
    })),
    ...triggers.map(t => ({
      id: t.id,
      text: t.message,
      time: new Date(t.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      read: t.read,
    })),
  ].slice(0, 10);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo and name: one line, never wraps into the status pill below */}
          <Link to="/" className="flex items-center gap-2 min-w-0 shrink mr-2 group">
            <Logo size={40} className="shrink-0" />
            <span className={`min-w-0 truncate font-display font-800 leading-none whitespace-nowrap text-[15px] sm:text-lg lg:text-xl tracking-tight ${textColor}`}>
              Indy <span className="text-[#2F6BFF]">Digital Marketing Solutions</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-body text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-[#2F6BFF]'
                    : isDark ? 'text-black/70 hover:text-black' : 'text-black/60 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setProfileOpen(false); setNotifOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'text-black/60 hover:text-black hover:bg-black/5' : 'text-black/60 hover:text-black hover:bg-black/5'
                }`}
              >
                <Globe size={15} />
                <span>{currentLang.code.toUpperCase()}</span>
                <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-10 w-48 glass rounded-xl border border-black/8 py-1 shadow-2xl">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setCurrentLang(lang); setLangOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-black/5 ${
                        currentLang.code === lang.code ? 'text-[#2F6BFF]' : 'text-black/80'
                      }`}
                    >
                      <Globe size={13} className="text-black/30 shrink-0" />
                      <span className="truncate">{lang.script}</span>
                      {currentLang.code === lang.code && <Check size={13} className="text-[#2F6BFF] ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                {/* Connect wallet, available to signed-in clients */}
                <ConnectWallet />
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => { if (!notifOpen) { markUserNotesRead(); markBroadcastsRead(); } setNotifOpen(!notifOpen); setProfileOpen(false); setLangOpen(false); setLangOpen(false); }}
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg text-black/60 hover:text-black hover:bg-black/5 transition-colors"
                  >
                    <Bell size={17} />
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2F6BFF] rounded-full" />
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-80 glass rounded-2xl border border-black/8 shadow-2xl overflow-hidden slide-in-right">
                      <div className="px-4 py-3 border-b border-black/8 flex items-center justify-between">
                        <span className="font-display font-600 text-sm text-[#0A0B0D]">Notifications</span>
                      </div>
                      {notifications.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <p className="text-xs text-black/40">You are all caught up.</p>
                          <p className="text-[11px] text-black/25 mt-1">Activity on your account will show up here.</p>
                        </div>
                      )}
                      {notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-black/5 flex gap-3 hover:bg-black/3 transition-colors ${!n.read ? 'bg-black/2' : ''}`}>
                          {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] mt-1.5 shrink-0" />}
                          {n.read && <div className="w-1.5 h-1.5 mt-1.5 shrink-0" />}
                          <div>
                            <p className="text-sm text-black/80">{n.text}</p>
                            <p className="text-xs text-black/30 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))}
                      <div className="p-3">
                        <Link to="/dashboard" className="block w-full text-center text-xs text-[#2F6BFF] py-2 hover:bg-black/5 rounded-lg transition-colors">View dashboard</Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setLangOpen(false); }}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-black/5 hover:bg-black/10 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#2F6BFF]/15 flex items-center justify-center text-xs font-medium text-[#2F6BFF]">{accountInitial}</div>
                    <span className="text-sm font-medium text-black/80 max-w-[110px] truncate">{accountName.split(' ')[0]}</span>
                    <ChevronDown size={12} className={`text-black/40 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-52 glass rounded-xl border border-black/8 py-1 shadow-2xl">
                      <div className="px-4 py-3 border-b border-black/8">
                        <p className="text-sm font-medium text-[#0A0B0D] truncate">{accountName}</p>
                        <p className="text-xs text-black/40 truncate">{accountEmail}</p>
                      </div>
                      <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-black/70 hover:text-black hover:bg-black/5 transition-colors">
                        <LayoutDashboard size={14} /> Dashboard
                      </Link>
                      <Link to="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-black/70 hover:text-black hover:bg-black/5 transition-colors">
                        <Settings size={14} /> Settings
                      </Link>
                      <div className="border-t border-black/8 mt-1">
                        <button
                          onClick={() => navigate('/login')}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-black/5 transition-colors"
                        >
                          <LogOut size={14} /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <ConnectWallet />
                <Link to="/login" className={`btn-ghost px-4 py-2 rounded-lg text-sm ${isDark ? '' : 'btn-ghost-dark'}`}>
                  Sign in
                </Link>
                <Link to="/signup" className="btn-primary px-5 py-2 rounded-lg text-sm">
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${isDark ? 'text-[#0A0B0D] hover:bg-black/10' : 'text-black hover:bg-black/10'}`}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={`lg:hidden border-t ${isDark ? 'bg-[#F7F7F5] border-black/5' : 'bg-[#F7F7F5] border-black/5'}`}>
          <div className="px-6 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-[#2F6BFF]/10 text-[#2F6BFF]'
                    : isDark ? 'text-black/70 hover:text-black hover:bg-black/5' : 'text-black/70 hover:text-black hover:bg-black/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-black/8 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link to="/settings" className={`btn-ghost px-4 py-3 rounded-xl text-sm text-center`}>Settings</Link>
                  <button onClick={() => navigate('/login')} className="text-sm text-[#EF4444] py-3">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className={`btn-ghost px-4 py-3 rounded-xl text-sm text-center ${isDark ? '' : 'btn-ghost-dark'}`}>Sign in</Link>
                  <Link to="/signup" className="btn-primary px-4 py-3 rounded-xl text-sm text-center">Get started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
