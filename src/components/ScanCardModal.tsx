import { useState, useEffect } from 'react';
import { X, Check, ScanLine, Keyboard } from 'lucide-react';
import { addPayoutMethod, TEST_PAN, type PayoutMethod } from '../lib/payoutMethods';

// Scan to add a payout card, the same viewfinder behavior already used in the
// withdrawal flow, now available ahead of time from Settings. Test PAN only,
// never a real card number, and only the last four digits are kept.
//
// Renders as a proper mobile bottom sheet (full-width, thumb reachable) and a
// centered dialog on larger screens.

export default function ScanCardModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (method: PayoutMethod) => void;
}) {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [manual, setManual] = useState({ number: '', name: '', expiry: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'scan') return;
    setProgress(0);
    setDone(false);
    let p = 0;
    const t = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(t);
        setDone(true);
      }
    }, 160);
    return () => clearInterval(t);
  }, [mode]);

  const save = () => {
    const source = mode === 'manual' ? manual.number : TEST_PAN;
    const digits = source.replace(/\D/g, '');
    if (mode === 'manual' && digits.length < 4) {
      setError('Enter at least the last four digits. Use the test number 4242 4242 4242 4242.');
      return;
    }
    const last4 = digits.slice(-4) || '4242';
    const method = addPayoutMethod({
      label: mode === 'manual' ? 'Card added manually' : 'Scanned card',
      last4,
      type: 'card',
      currency: 'USD',
      isDefault: false,
    });
    onSaved(method);
  };

  const fields = [
    { label: 'Card number', value: progress >= 40 ? '**** **** **** 4242' : '', done: mode === 'manual' || progress >= 40 },
    { label: 'Cardholder name', value: progress >= 68 ? 'CARD HOLDER' : '', done: mode === 'manual' || progress >= 68 },
    { label: 'Expiry', value: progress >= 88 ? '12/29' : '', done: mode === 'manual' || progress >= 88 },
  ];
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-[81] flex sm:items-center sm:justify-center">
        <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-black/10 shadow-2xl max-h-[92vh] overflow-y-auto slide-up">
          <div className="sticky top-0 bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2F6BFF]/12 flex items-center justify-center">
                <ScanLine size={15} className="text-[#2F6BFF]" />
              </div>
              <span className="font-display font-600 text-base text-[#0A0B0D]">Add a payout card</span>
            </div>
            <button onClick={onClose} className="text-black/40 hover:text-black/70" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            {mode === 'scan' ? (
              <>
                <p className="text-sm text-black/45 mb-4">Hold the card in the frame. Fields populate as they are detected.</p>
                <div className="relative rounded-2xl overflow-hidden bg-[#0F1420] border-2 border-[#2F6BFF]/40 h-44 mb-5">
                  <div className="absolute inset-4 border-2 border-[#2F6BFF]/30 rounded-xl" />
                  {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map(pos => (
                    <div key={pos} className={`absolute ${pos} w-4 h-4 border-[#2F6BFF]`}
                      style={{
                        borderTopWidth: pos.includes('top') ? '2px' : 0,
                        borderBottomWidth: pos.includes('bottom') ? '2px' : 0,
                        borderLeftWidth: pos.includes('left') ? '2px' : 0,
                        borderRightWidth: pos.includes('right') ? '2px' : 0,
                      }} />
                  ))}
                  {!done && <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#2F6BFF] to-transparent scan-line" />}
                  {done && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 border-2 border-[#22C55E] flex items-center justify-center">
                        <Check size={22} className="text-[#22C55E]" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span className="text-xs text-white/50">{done ? 'Card detected' : 'Scanning...'}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-black/45 mb-4">Enter the details by hand. Use the test number only.</p>
                <div className="space-y-3 mb-5">
                  <input value={manual.number} onChange={e => setManual(m => ({ ...m, number: e.target.value }))}
                    placeholder="Card number (test only)" inputMode="numeric"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#2F6BFF]" />
                  <input value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))}
                    placeholder="Cardholder name"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF]" />
                  <input value={manual.expiry} onChange={e => setManual(m => ({ ...m, expiry: e.target.value }))}
                    placeholder="MM/YY"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#2F6BFF]" />
                </div>
              </>
            )}

            <div className="space-y-2.5 mb-5">
              {fields.map(field => (
                <div key={field.label} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${field.done ? 'border-[#22C55E]/30 bg-[#22C55E]/5' : 'border-black/8'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${field.done ? 'bg-[#22C55E]' : 'bg-black/10'}`}>
                    {field.done && <Check size={10} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-[10px] text-black/30 mb-0.5 font-mono">{field.label.toUpperCase()}</p>
                    <p className="font-mono text-sm text-[#0A0B0D]">{field.value || ', '}</p>
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-[#D97706] mb-3 leading-relaxed">{error}</p>}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => { setError(null); setMode(mode === 'scan' ? 'manual' : 'scan'); }}
                className="order-2 sm:order-1 flex-1 flex items-center justify-center gap-2 border border-black/15 py-3 rounded-xl text-sm text-black/60 hover:border-black/30 transition-colors"
              >
                {mode === 'scan' ? <><Keyboard size={15} /> Enter manually</> : <><ScanLine size={15} /> Scan instead</>}
              </button>
              <button onClick={save} className="order-1 sm:order-2 flex-1 btn-primary py-3 rounded-xl text-sm">
                Save card
              </button>
            </div>
            <p className="text-[10px] text-black/25 mt-3 leading-relaxed text-center">
              Test card only. No real card number is stored. The processor holds card data; IndySolutions keeps only the last four digits.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}