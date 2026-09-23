import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function SessionExpired() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center mx-auto mb-6">
          <Lock size={24} className="text-[#F59E0B]" />
        </div>
        <h1 className="font-display font-700 text-2xl text-[#0A0B0D] mb-3">Session expired</h1>
        <p className="text-black/40 text-sm leading-relaxed mb-8">
          For your security, your session has expired after a period of inactivity. Sign back in to continue where you left off.
        </p>
        <Link to="/login" className="btn-primary px-8 py-3.5 rounded-xl text-sm block">Sign back in</Link>
      </div>
    </div>
  );
}
