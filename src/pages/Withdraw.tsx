import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Info, AlertCircle, ScanLine, RefreshCw } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const steps = ['Source', 'Rate & Fees', 'Destination', 'Card Verify', 'Confirm', 'Done'];

const sources = [
  { id: 'nft', label: 'NFT Proceeds', balance: 21000 },
  { id: 'stock', label: 'Stock Proceeds', balance: 6485 },
  { id: 'other', label: 'Other Investments', balance: 7300 },
];

const accounts = [
  { id: 'barclays', label: 'Barclays', last4: '4521', type: 'bank', currency: 'GBP' },
  { id: 'revolut', label: 'Revolut Debit', last4: '8834', type: 'card', currency: 'EUR' },
];

export default function Withdraw() {
  const [step, setStep] = useState<Step>(1);
  const [source, setSource] = useState('nft');
  const [amount, setAmount] = useState('3200');
  const [destination, setDestination] = useState('barclays');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [rateRefreshed] = useState(0);
  const [failed] = useState(false);

  const selectedSource = sources.find(s => s.id === source) || sources[0];
  const selectedDest = accounts.find(a => a.id === destination) || accounts[0];
  const amt = parseFloat(amount) || 0;
  const fxRate = selectedDest.currency === 'GBP' ? 0.79 : 0.92;
  const fxSymbol = selectedDest.currency === 'GBP' ? 'GBP ' : 'EUR ';
  const serviceFee = amt * 0.004;
  const taxEstimate = amt * 0.02;
  const net = (amt - serviceFee - taxEstimate) * fxRate;

  const next = () => {
    if (step === 4) {
      setScanProgress(0);
      setScanComplete(false);
      let p = 0;
      const t = setInterval(() => {
        p += 10;
        setScanProgress(p);
        if (p >= 100) { clearInterval(t); setScanComplete(true); setTimeout(() => setStep(5), 800); }
      }, 200);
      return;
    }
    if (step < 6) setStep((step + 1) as Step);
  };
  const back = () => step > 1 && setStep((step - 1) as Step);

  return (
    <div className="min-h-screen bg-[#F7F7F5] pt-20">
      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="font-display font-700 text-2xl text-[#0A0B0D] mb-6">Withdraw funds</h1>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-1 mb-2">
            {steps.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                i + 1 < step ? 'bg-[#22C55E]' : i + 1 === step ? 'bg-[#2F6BFF]' : 'bg-black/10'
              }`} />
            ))}
          </div>
          <p className="text-xs text-black/30 font-mono">Step {step} of {steps.length}: {steps[step - 1]}</p>
        </div>

        <div className="glass rounded-2xl border border-black/8 p-8">
          {/* Step 1, Source & Amount */}
          {step === 1 && (
            <div>
              <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-6">Select source & amount</h2>
              <div className="space-y-3 mb-6">
                {sources.map(src => (
                  <button key={src.id} onClick={() => setSource(src.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      source === src.id ? 'border-[#2F6BFF] bg-[#2F6BFF]/5' : 'border-black/8 hover:border-black/20'
                    }`}>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#0A0B0D]">{src.label}</p>
                      <p className="text-xs text-black/30 mt-0.5 font-mono">Available: ${src.balance.toLocaleString()}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${source === src.id ? 'border-[#2F6BFF] bg-[#2F6BFF]' : 'border-black/20'}`}>
                      {source === src.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-black/40 mb-2">Amount (USD)</label>
                <div className="flex items-center gap-3 bg-black/5 border border-black/10 rounded-xl p-4 focus-within:border-[#2F6BFF] transition-colors">
                  <span className="font-mono text-black/40">$</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="flex-1 bg-transparent font-mono font-700 text-2xl text-[#0A0B0D] outline-none" />
                </div>
                <p className="text-xs text-black/25 mt-1.5">Available: ${selectedSource.balance.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Step 2, Rate & fees */}
          {step === 2 && (
            <div>
              <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-2">Rate & fee breakdown</h2>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#22C55E] dot-pulse" />
                <span className="text-xs text-black/30 font-mono">Rates refresh every 30s</span>
                <button className="text-black/30 hover:text-black/60 ml-auto"><RefreshCw size={13} /></button>
              </div>

              <div className="bg-black/3 rounded-2xl border border-black/8 p-5 space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Amount requested</span>
                  <span className="font-mono text-[#0A0B0D]">${amt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-black/50">Live FX rate</span>
                    <span className="text-[10px] chip-accent px-1.5 py-0.5 rounded-full font-mono">{selectedDest.currency}</span>
                  </div>
                  <span className="font-mono text-[#0A0B0D]">1 USD = {fxRate} {selectedDest.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-black/50">Est. tax withheld</span>
                    <button title="This is an estimate. Consult a tax advisor for your specific situation.">
                      <Info size={12} className="text-black/25" />
                    </button>
                  </div>
                  <span className="font-mono text-black/60">-${taxEstimate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Service fee (0.4%)</span>
                  <span className="font-mono text-black/60">-${serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-black/10">
                  <span className="font-display font-700 text-base text-[#0A0B0D]">You will receive</span>
                  <span className="font-mono font-800 text-2xl text-[#22C55E]">{fxSymbol}{net.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F59E0B]/8 border border-[#F59E0B]/15">
                <p className="text-xs text-[#F59E0B]/80 leading-relaxed">
                  Tax estimate is for display only and may not reflect your actual tax liability. Consult a qualified tax advisor in your jurisdiction.
                </p>
              </div>
            </div>
          )}

          {/* Step 3, Destination */}
          {step === 3 && (
            <div>
              <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-2">Select destination</h2>
              <p className="text-sm text-black/40 mb-6">IndySolutions securely routes your withdrawal to your bank via our licensed payment partner.</p>
              <div className="space-y-3">
                {accounts.map(acc => (
                  <button key={acc.id} onClick={() => setDestination(acc.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      destination === acc.id ? 'border-[#2F6BFF] bg-[#2F6BFF]/5' : 'border-black/8 hover:border-black/20'
                    }`}>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#0A0B0D]">{acc.label} ****{acc.last4}</p>
                      <p className="text-xs text-black/30 mt-0.5">{acc.type === 'bank' ? 'Bank account' : 'Debit card'}, Payout in {acc.currency}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${destination === acc.id ? 'border-[#2F6BFF] bg-[#2F6BFF]' : 'border-black/20'}`}>
                      {destination === acc.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
              <button className="mt-4 w-full py-3 rounded-xl border border-dashed border-black/15 text-sm text-black/30 hover:text-black/60 hover:border-black/30 transition-colors">
                + Add new account
              </button>
            </div>
          )}

          {/* Step 4, Card scanner */}
          {step === 4 && (
            <div>
              <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-2">Verify your card</h2>
              <p className="text-sm text-black/40 mb-6">Hold your card in the frame. Fields populate automatically as they're detected.</p>

              {/* Scanner viewfinder */}
              <div className="relative rounded-2xl overflow-hidden bg-[#F7F7F5] border-2 border-[#2F6BFF]/40 h-48 mb-6">
                <div className="absolute inset-4 border-2 border-[#2F6BFF]/30 rounded-xl" />
                {/* Corner marks */}
                {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map(pos => (
                  <div key={pos} className={`absolute ${pos} w-4 h-4 border-[#2F6BFF]`}
                    style={{ borderTopWidth: pos.includes('top') ? '2px' : 0, borderBottomWidth: pos.includes('bottom') ? '2px' : 0, borderLeftWidth: pos.includes('left') ? '2px' : 0, borderRightWidth: pos.includes('right') ? '2px' : 0 }} />
                ))}
                {/* Scan line */}
                {!scanComplete && (
                  <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#2F6BFF] to-transparent scan-line" />
                )}
                {scanComplete && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 border-2 border-[#22C55E] flex items-center justify-center">
                      <Check size={22} className="text-[#22C55E]" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-xs text-black/30">{scanComplete ? 'Card verified' : 'Scanning...'}</span>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                {[
                  { label: 'Card number', value: scanProgress >= 40 ? '**** **** **** 8834' : '', done: scanProgress >= 40 },
                  { label: 'Cardholder name', value: scanProgress >= 70 ? 'MARCUS CHEN' : '', done: scanProgress >= 70 },
                  { label: 'Expiry', value: scanProgress >= 90 ? '09/28' : '', done: scanProgress >= 90 },
                ].map(field => (
                  <div key={field.label} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${field.done ? 'border-[#22C55E]/30 bg-[#22C55E]/5' : 'border-black/8'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${field.done ? 'bg-[#22C55E]' : 'bg-black/10'}`}>
                      {field.done && <Check size={10} className="text-[#0A0B0D]" />}
                    </div>
                    <div>
                      <p className="text-[10px] text-black/30 mb-0.5 font-mono">{field.label.toUpperCase()}</p>
                      <p className="font-mono text-sm text-[#0A0B0D]">{field.value || ', '}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => next()}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 text-[#2F6BFF] py-3 rounded-xl text-sm hover:bg-[#2F6BFF]/15 transition-colors"
              >
                <ScanLine size={15} /> Scan card
              </button>
              <button className="w-full mt-2 text-xs text-black/25 py-2 hover:text-black/40 transition-colors">Enter manually instead</button>
            </div>
          )}

          {/* Step 5, Confirm */}
          {step === 5 && (
            <div>
              <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-6">Confirm withdrawal</h2>
              <div className="bg-black/3 rounded-2xl border border-black/8 p-5 space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">To</span>
                  <span className="text-[#0A0B0D]">{selectedDest.label} ****{selectedDest.last4}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Amount</span>
                  <span className="font-mono text-[#0A0B0D]">${amt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">FX rate (locked in)</span>
                  <span className="font-mono text-[#0A0B0D]">1 USD = {fxRate} {selectedDest.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Fees & tax est.</span>
                  <span className="font-mono text-black/60">-${(serviceFee + taxEstimate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Est. arrival</span>
                  <span className="font-mono text-[#0A0B0D]">1 to 3 business days</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-black/10">
                  <span className="font-display font-700 text-base text-[#0A0B0D]">Landing amount</span>
                  <span className="font-mono font-800 text-2xl text-[#22C55E]">
                    {selectedDest.currency === 'GBP' ? 'GBP ' : 'EUR '}{net.toFixed(2)}
                  </span>
                </div>
              </div>

              {failed && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 mb-4">
                  <AlertCircle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-[#EF4444] font-medium">Withdrawal failed</p>
                    <p className="text-xs text-black/50 mt-0.5">Your card issuer declined the transaction.</p>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs text-black/60 hover:text-black">Try another method</button>
                      <Link to="/contact" className="text-xs text-[#2F6BFF]">Contact support</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6, Success */}
          {step === 6 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 border-2 border-[#22C55E]/30 flex items-center justify-center mx-auto mb-6">
                <Check size={28} className="text-[#22C55E]" />
              </div>
              <h2 className="font-display font-700 text-2xl text-[#0A0B0D] mb-3">Withdrawal initiated</h2>
              <p className="text-black/40 text-sm mb-3">
                {selectedDest.currency === 'GBP' ? 'GBP ' : 'EUR '}{net.toFixed(2)} is on its way to {selectedDest.label} ****{selectedDest.last4}
              </p>
              <p className="text-black/30 text-xs mb-8">Estimated arrival: 1 to 3 business days</p>
              <div className="flex flex-col gap-3">
                <Link to="/transactions" className="btn-primary py-3 rounded-xl text-sm">Track this withdrawal</Link>
                <Link to="/dashboard" className="btn-ghost py-3 rounded-xl text-sm">Back to dashboard</Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 6 && step !== 4 && (
            <div className="flex items-center gap-3 mt-8">
              {step > 1 && (
                <button onClick={back} className="btn-ghost px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <button onClick={next} className="btn-primary flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                {step === 5 ? 'Confirm withdrawal' : 'Continue'} <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
