import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1200));
    if (email === 'demo@indysolutions.com' && password === 'demo') {
      navigate('/dashboard');
    } else {
      setLoading(false);
      setError('Invalid credentials. Try demo@indysolutions.com / demo');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=1920&h=1080&fit=crop&auto=format"
          alt=""
          className="w-full h-full object-cover opacity-10"
        />
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
            <Logo size={40} />
            <span className="font-display font-700 text-xl text-[#0A0B0D]">Indy<span className="text-[#2F6BFF]">Solutions</span></span>
          </Link>
          <h1 className="font-display font-700 text-3xl text-[#0A0B0D] mb-2">Welcome back</h1>
          <p className="text-black/40 text-sm">Sign in to your portfolio</p>
        </div>

        <div className="glass rounded-2xl border border-black/8 p-8">
          {/* SSO */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Google', icon: 'G' },
              { label: 'Apple', icon: '' },
            ].map(sso => (
              <button key={sso.label} className="btn-ghost px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 font-medium">
                <span className="font-mono text-xs">{sso.icon}</span>
                Continue with {sso.label}
              </button>
            ))}
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

          <p className="text-center text-xs text-black/30 mt-6">
            Demo credentials: <span className="text-black/50 font-mono">demo@indysolutions.com / demo</span>
          </p>
        </div>

        <p className="text-center text-sm text-black/40 mt-8">
          No account?{' '}
          <Link to="/signup" className="text-[#2F6BFF] hover:text-[#4F82FF] transition-colors">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
