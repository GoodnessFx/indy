import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GenericError() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={24} className="text-[#EF4444]" />
        </div>
        <h1 className="font-display font-700 text-2xl text-[#0A0B0D] mb-3">Something went wrong</h1>
        <p className="text-black/40 text-sm leading-relaxed mb-8">
          We hit an unexpected error. Our team has been notified. You can try reloading or reach out to support if it persists.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary py-3 rounded-xl text-sm flex items-center gap-2 justify-center">
            <RefreshCw size={15} /> Reload page
          </button>
          <Link to="/contact" className="btn-ghost py-3 rounded-xl text-sm">Contact support</Link>
        </div>
      </div>
    </div>
  );
}
