import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import { getActiveProfile, onAuthChange, rememberProfile, startGoogleSignIn } from '../lib/googleAuth';
import { recordLogin } from '../lib/audit';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Coming back from Google (Supabase OAuth) lands here with a session already
  // present, so send the user straight to the dashboard.
  useEffect(() => {
    let active = true;
    getActiveProfile().then(profile => {
      if (active && profile) navigate('/dashboard', { replace: true });
    });
    const unsubscribe = onAuthChange(profile => {
      if (active && profile) navigate('/dashboard', { replace: true });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate]);

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const profile = await startGoogleSignIn('/dashboard');
      // null means the browser is being redirected to Google (Supabase flow).
      if (profile) {
        recordLogin('google', profile.email, profile.name);
        navigate('/dashboard');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed. Try again.');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    // Prototype email sign in. There is no password backend yet, so a valid
    // email and password open a local session. Replace with a real auth call
    // (for example Supabase signInWithPassword) once the backend is wired.
    const derived = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
    rememberProfile({ sub: `local-${Date.now()}`, email, name: derived || 'Investor' });
    recordLogin('email', email, derived || 'Investor');
    window.dispatchEvent(new Event('indy-auth'));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#0A0B0D]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7F7F5] via-[#0d1020] to-white" />
        {/* Particle dots */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#2F6BFF]/40 float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-8">
            <Logo size={48} />
            <span className="font-display font-800 text-2xl text-[#0A0B0D]">Indy <span className="text-[#2F6BFF]">Digital Marketing Solutions</span></span>
          </Link>
          <h1 className="font-display font-700 text-3xl text-[#0A0B0D] mb-2">Welcome back</h1>
          <p className="text-black/40 text-sm">Sign in to your portfolio</p>
        </div>

        <div className="glass rounded-2xl border border-black/8 p-8">
          {/* SSO, Google only */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="btn-ghost w-full px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2.5 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.8 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.2-3.9z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.8 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.7-.2-3.9z" />
              </svg>
              {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-black/8" />
            <span className="text-xs text-black/30">or email</span>
            <div className="flex-1 h-px bg-black/8" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-black/50 mb-2 font-medium">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="marcus@example.com"
                className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] placeholder-black/20 outline-none focus:border-[#2F6BFF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-black/50 mb-2 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 pr-12 text-sm text-[#0A0B0D] placeholder-black/20 outline-none focus:border-[#2F6BFF] transition-colors"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link to="/contact" className="text-xs text-black/30 hover:text-[#2F6BFF] transition-colors">Forgot password?</Link>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20">
                <AlertCircle size={14} className="text-[#EF4444] shrink-0" />
                <p className="text-xs text-[#EF4444]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-black/40 mt-8">
          No account?{' '}
          <Link to="/signup" className="text-[#2F6BFF] hover:text-[#4F82FF] transition-colors">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
