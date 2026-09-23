import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, Bell, Menu, X, TrendingUp, ChevronDown, LogOut, Settings, LayoutDashboard, User } from 'lucide-react';
import { languages } from '../data/mock';
import Logo from './Logo';
import ConnectWallet from './ConnectWallet';

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
  const [notifCount] = useState(3);
  const location = useLocation();
  const navigate = useNavigate();

  const isLight = ['/how-it-works', '/security', '/pricing', '/about', '/contact'].includes(location.pathname);
  const isDark = !isLight;

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

  const notifications = [
    { id: 1, text: 'Withdrawal of $3,200 is processing', time: '2h ago', read: false },
    { id: 2, text: 'NVDA up 2.63% today', time: '4h ago', read: false },
    { id: 3, text: 'KYC verification approved', time: '1d ago', read: false },
    { id: 4, text: 'New login from Chrome on macOS', time: '2d ago', read: true },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo size={36} className="transition-all group-hover:shadow-[0_0_20px_rgba(47,107,255,0.6)]" />
            <span className={`font-display font-700 text-lg tracking-tight ${textColor}`}>
              Indy<span className="text-[#2F6BFF]">Solutions</span>
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
                      <span>{lang.flag}</span>
                      <span>{lang.script}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); setLangOpen(false); }}
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg text-black/60 hover:text-black hover:bg-black/5 transition-colors"
                  >
                    <Bell size={17} />
                    {notifCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#2F6BFF] rounded-full" />
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-80 glass rounded-2xl border border-black/8 shadow-2xl overflow-hidden slide-in-right">
                      <div className="px-4 py-3 border-b border-black/8 flex items-center justify-between">
                        <span className="font-display font-600 text-sm text-[#0A0B0D]">Notifications</span>
                        <button className="text-xs text-[#2F6BFF] hover:text-[#4F82FF]">Mark all read</button>
                      </div>
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
                        <button className="w-full text-center text-xs text-[#2F6BFF] py-2 hover:bg-black/5 rounded-lg transition-colors">View all notifications</button>
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
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" alt="Profile" className="w-7 h-7 rounded-lg object-cover" />
                    <span className="text-sm font-medium text-black/80">Marcus</span>
                    <ChevronDown size={12} className={`text-black/40 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-52 glass rounded-xl border border-black/8 py-1 shadow-2xl">
                      <div className="px-4 py-3 border-b border-black/8">
                        <p className="text-sm font-medium text-[#0A0B0D]">Marcus Chen</p>
                        <p className="text-xs text-black/40">marcus@example.com</p>
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
