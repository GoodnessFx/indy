import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    if (username === 'admin' && password === 'admin123') {
      navigate('/admin/dashboard');
    } else {
      setLoading(false);
      setError('Invalid credentials. (admin / admin123)');
    }
  };

  return (
    <div className="min-h-screen admin-surface flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#2F6BFF]/20 border border-[#2F6BFF]/30 flex items-center justify-center mx-auto mb-4">
            <Lock size={18} className="text-[#2F6BFF]" />
          </div>
          <h1 className="font-mono font-700 text-lg text-[#0A0B0D]">Admin Console</h1>
          <p className="text-xs text-black/30 mt-1">Indy Digital Marketing Solutions, Restricted access</p>
        </div>

        <div className="bg-white border border-black/5 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-black/40 mb-2 font-mono">USERNAME</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-black/3 border border-black/8 rounded-lg px-4 py-2.5 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF]/50 transition-colors font-mono"
                autoComplete="off" />
            </div>
            <div>
              <label className="block text-xs text-black/40 mb-2 font-mono">PASSWORD</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/3 border border-black/8 rounded-lg px-4 py-2.5 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF]/50 transition-colors font-mono"
                autoComplete="off" />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-[#EF4444]">
                <AlertCircle size={12} /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#2F6BFF]/20 border border-[#2F6BFF]/30 text-sm text-[#2F6BFF] font-mono hover:bg-[#2F6BFF]/30 transition-colors disabled:opacity-50">
              {loading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] text-black/15 mt-6 font-mono">ACCESS ATTEMPT WILL BE LOGGED</p>
      </div>
    </div>
  );
}
