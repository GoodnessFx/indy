import { useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import AdminLayout from './AdminLayout';

const pending = [
  { id: 'kyc-1', name: 'Amara Osei', email: 'amara@example.com', country: 'GH', docType: 'Passport', submitted: '2026-09-22', docs: ['photo-1531123897727-8f129e1688ce', 'photo-1472099645785-5658abf4ff4e'] },
  { id: 'kyc-2', name: 'Hiroshi Tanaka', email: 'hiroshi@example.com', country: 'JP', docType: "Driver's license", submitted: '2026-09-21', docs: ['photo-1507003211169-0a1dd7228f2d'] },
  { id: 'kyc-3', name: 'Fatima Al-Rashid', email: 'fatima@example.com', country: 'AE', docType: 'National ID', submitted: '2026-09-20', docs: ['photo-1531746020798-e6953c6e8e04'] },
];

export default function AdminKYC() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'rejected'>>({});

  const approve = (id: string) => setDecisions(p => ({ ...p, [id]: 'approved' }));
  const reject = (id: string) => {
    if (!rejectReason[id]?.trim()) return;
    setDecisions(p => ({ ...p, [id]: 'rejected' }));
    setRejectOpen(null);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="font-mono font-700 text-xl text-[#0A0B0D] mb-2">KYC Review Queue</h1>
        <p className="text-xs text-black/30 font-mono mb-6">{pending.length} submissions pending review</p>

        <div className="space-y-3">
          {pending.map(sub => {
            const decision = decisions[sub.id];
            return (
              <div key={sub.id} className={`bg-white border rounded-xl overflow-hidden transition-colors ${
                decision === 'approved' ? 'border-[#22C55E]/20' :
                decision === 'rejected' ? 'border-[#EF4444]/20' :
                'border-black/5'
              }`}>
                <button
                  onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="font-mono text-sm text-black/80">{sub.name}</p>
                      <p className="font-mono text-xs text-black/30">{sub.email}, {sub.country}, {sub.docType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-black/20">{sub.submitted}</span>
                    {decision ? (
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono ${decision === 'approved' ? 'chip-gain' : 'chip-loss'}`}>
                        {decision}
                      </span>
                    ) : (
                      <span className="text-[10px] chip-warning px-2.5 py-1 rounded-full font-mono">pending</span>
                    )}
                    <ChevronDown size={13} className={`text-black/25 transition-transform ${expanded === sub.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {expanded === sub.id && (
                  <div className="px-5 pb-5 border-t border-black/5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 mb-5">
                      {sub.docs.map((doc, i) => (
                        <div key={i} className="rounded-lg overflow-hidden aspect-video bg-black/5">
                          <div className="w-full h-full bg-black/5 flex items-center justify-center text-xs text-black/30">Document Scan</div>
                        </div>
                      ))}
                    </div>

                    {!decision && (
                      <div className="flex items-start gap-3">
                        <button onClick={() => approve(sub.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22C55E]/15 text-xs text-[#22C55E] font-mono hover:bg-[#22C55E]/25 transition-colors">
                          <Check size={12} /> Approve
                        </button>
                        <div className="flex-1">
                          {rejectOpen === sub.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={rejectReason[sub.id] || ''}
                                onChange={e => setRejectReason(p => ({ ...p, [sub.id]: e.target.value }))}
                                placeholder="Required: reason for rejection (sent to user)"
                                className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none resize-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button onClick={() => reject(sub.id)}
                                  disabled={!rejectReason[sub.id]?.trim()}
                                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EF4444]/15 text-xs text-[#EF4444] font-mono disabled:opacity-30 hover:bg-[#EF4444]/25 transition-colors">
                                  <X size={12} /> Reject
                                </button>
                                <button onClick={() => setRejectOpen(null)} className="text-xs text-black/30 font-mono">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setRejectOpen(sub.id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EF4444]/10 text-xs text-[#EF4444]/70 font-mono hover:bg-[#EF4444]/20 hover:text-[#EF4444] transition-colors">
                              <X size={12} /> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {decision && (
                      <p className={`text-xs font-mono ${decision === 'approved' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                        {decision === 'approved' ? 'KYC approved. User notified.' : `KYC rejected. Reason sent to user.`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
