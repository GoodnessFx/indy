import { Clock } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#0A0B0D] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 flex items-center justify-center mx-auto mb-6">
          <Clock size={24} className="text-[#2F6BFF]" />
        </div>
        <h1 className="font-display font-800 text-3xl text-white mb-4">Scheduled maintenance</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-6">
          We're upgrading IndySolutions to serve you better. No action is needed — your portfolio and funds are completely safe.
        </p>
        <div className="glass rounded-2xl border border-white/8 px-6 py-4 mb-8">
          <p className="text-xs text-white/30 mb-2 font-mono">ESTIMATED RETURN</p>
          <p className="font-mono font-700 text-2xl text-white">Today at 06:00 UTC</p>
        </div>
        <div className="flex items-center gap-2 justify-center">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B] dot-pulse" />
          <span className="text-xs text-white/30 font-mono">Maintenance in progress</span>
        </div>
      </div>
    </div>
  );
}
