import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-900 text-[20vw] text-white/3 select-none leading-none">404</span>
      </div>
      <div className="relative z-10 text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 flex items-center justify-center mx-auto mb-8">
          <span className="font-mono font-800 text-3xl text-[#2F6BFF]">?</span>
        </div>
        <h1 className="font-display font-800 text-4xl text-white mb-4">Lost in the market</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-10">
          That page doesn't exist — but your portfolio does. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary px-6 py-3 rounded-xl text-sm flex items-center gap-2 justify-center">
            <Home size={15} /> Go home
          </Link>
          <Link to="/dashboard" className="btn-ghost px-6 py-3 rounded-xl text-sm flex items-center gap-2 justify-center">
            <ArrowLeft size={15} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
