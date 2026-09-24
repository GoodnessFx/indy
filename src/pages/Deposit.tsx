import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CreditCard, Bitcoin, ArrowLeft, ArrowRight, Check, Copy, QrCode } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;
type Method = 'bank' | 'card' | 'crypto';

const steps = ['Method', 'Amount', 'Instructions', 'Confirmation'];

export default function Deposit() {
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>('bank');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [copied, setCopied] = useState(false);

  const next = () => step < 4 && setStep((step + 1) as Step);
  const back = () => step > 1 && setStep((step - 1) as Step);

  const referenceCode = 'INDY-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const walletAddress = 'TXhGZ9pR8KmQvV2cY4NsLwBiJuF3dE6oMn';

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] pt-20">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-600 transition-all ${
                  i + 1 < step ? 'bg-[#22C55E] text-white' : i + 1 === step ? 'bg-[#2F6BFF] text-white' : 'bg-black/10 text-black/30'
                }`}>
                  {i + 1 < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 hidden sm:block ${i + 1 === step ? 'text-[#0A0B0D]' : 'text-black/25'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-px flex-1 mx-2 mb-4 ${i + 1 < step ? 'bg-[#22C55E]' : 'bg-black/10'}`} />}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl border border-black/8 p-8">
          {/* Step 1, Method */}
          {step === 1 && (
            <div>
              <h2 className="font-display font-700 text-2xl text-[#0A0B0D] mb-2">Choose deposit method</h2>
              <p className="text-black/40 text-sm mb-8">Select how you'd like to fund your account</p>
              <div className="space-y-3">
                {[
                  { id: 'bank' as Method, icon: Building2, label: 'Bank transfer', desc: '1 to 3 business days, No fees', color: 'text-[#2F6BFF]', bg: 'bg-[#2F6BFF]/10' },
                  { id: 'card' as Method, icon: CreditCard, label: 'Debit or credit card', desc: 'Instant, 1.5% fee', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' },
                  { id: 'crypto' as Method, icon: Bitcoin, label: 'Crypto (BTC / USDT)', desc: '10 to 30 min, Network fee', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setMethod(opt.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      method === opt.id ? 'border-[#2F6BFF] bg-[#2F6BFF]/5' : 'border-black/8 hover:border-black/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${opt.bg} flex items-center justify-center shrink-0`}>
                      <opt.icon size={18} className={opt.color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#0A0B0D]">{opt.label}</p>
                      <p className="text-xs text-black/30 mt-0.5">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      method === opt.id ? 'border-[#2F6BFF] bg-[#2F6BFF]' : 'border-black/20'
                    }`}>
                      {method === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2, Amount */}
          {step === 2 && (
            <div>
              <h2 className="font-display font-700 text-2xl text-[#0A0B0D] mb-2">Enter amount</h2>
              <p className="text-black/40 text-sm mb-8">Minimum deposit: $50</p>
              <div className="mb-6">
                <div className="flex items-center gap-3 bg-black/5 border border-black/10 rounded-2xl p-4 focus-within:border-[#2F6BFF] transition-colors">
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className="bg-transparent text-[#0A0B0D] text-sm outline-none cursor-pointer">
                    {['USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
                  </select>
                  <div className="w-px h-6 bg-black/10" />
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent font-mono font-700 text-2xl text-[#0A0B0D] placeholder-black/20 outline-none"
                  />
                </div>
                {amount && currency !== 'USD' && (
                  <p className="text-xs text-black/30 mt-2 ml-1">
                    approx.  ${(parseFloat(amount) * 1.08).toFixed(2)} USD, Live rate
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {['100', '500', '1000', '5000'].map(preset => (
                  <button key={preset} onClick={() => setAmount(preset)}
                    className={`px-4 py-2 rounded-xl text-sm font-mono transition-colors ${
                      amount === preset ? 'bg-[#2F6BFF] text-white' : 'bg-black/5 text-black/40 hover:text-black hover:bg-black/10'
                    }`}>
                    ${preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3, Instructions */}
          {step === 3 && (
            <div>
              <h2 className="font-display font-700 text-2xl text-[#0A0B0D] mb-2">Deposit instructions</h2>
              <p className="text-black/40 text-sm mb-8">
                {method === 'bank' ? 'Transfer to our account using the details below' :
                 method === 'card' ? 'Enter your card details' :
                 'Send crypto to the address below'}
              </p>

              {method === 'bank' && (
                <div className="space-y-3">
                  {[
                    { label: 'Bank name', value: 'Barclays Business Banking' },
                    { label: 'Account name', value: 'Indy Digital Marketing Solutions Ltd' },
                    { label: 'Sort code', value: '20-00-00' },
                    { label: 'Account number', value: '83621047' },
                    { label: 'SWIFT / BIC', value: 'BARCGB22' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between p-3.5 rounded-xl bg-black/5 border border-black/8">
                      <div>
                        <p className="text-[10px] text-black/30 mb-0.5 font-mono">{row.label.toUpperCase()}</p>
                        <p className="font-mono text-sm text-[#0A0B0D]">{row.value}</p>
                      </div>
                      <button onClick={() => copy(row.value)} className="text-black/30 hover:text-black/60 transition-colors">
                        <Copy size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="p-4 rounded-xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/20">
                    <p className="text-xs text-black/50 mb-2">Include this reference code in your transfer:</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-700 text-[#2F6BFF]">{referenceCode}</span>
                      <button onClick={() => copy(referenceCode)} className="text-[#2F6BFF]/60 hover:text-[#2F6BFF]">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {method === 'card' && (
                <div className="space-y-4">
                  {[
                    { label: 'Card number', placeholder: '**** **** **** ****', type: 'text' },
                    { label: 'Cardholder name', placeholder: 'Marcus Chen', type: 'text' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs text-black/40 mb-2">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder}
                        className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] placeholder-black/20 outline-none focus:border-[#22C55E] transition-colors font-mono" />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-black/40 mb-2">Expiry</label>
                      <input type="text" placeholder="MM / YY"
                        className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] placeholder-black/20 outline-none focus:border-[#22C55E] transition-colors font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs text-black/40 mb-2">CVV</label>
                      <input type="text" placeholder="***"
                        className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] placeholder-black/20 outline-none focus:border-[#22C55E] transition-colors font-mono" />
                    </div>
                  </div>
                </div>
              )}

              {method === 'crypto' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    {['USDT', 'BTC'].map(c => (
                      <button key={c} className="px-4 py-2 rounded-xl text-sm font-mono bg-black/5 text-black/40 hover:text-black hover:bg-black/10 transition-colors">{c}</button>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                    <p className="text-xs text-[#F59E0B] font-medium mb-1">Network warning</p>
                    <p className="text-xs text-black/50">Send only USDT on the TRC-20 network. Sending on the wrong network will result in permanent loss of funds.</p>
                  </div>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center">
                      <QrCode size={80} className="text-[#0A0B0D]" />
                    </div>
                    <div className="w-full p-3 rounded-xl bg-black/5 border border-black/8 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-black/60 truncate">{walletAddress}</span>
                      <button onClick={() => copy(walletAddress)} className={`shrink-0 transition-colors ${copied ? 'text-[#22C55E]' : 'text-black/30 hover:text-black/60'}`}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4, Success */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 border-2 border-[#22C55E]/30 flex items-center justify-center mx-auto mb-6">
                <Check size={28} className="text-[#22C55E]" />
              </div>
              <h2 className="font-display font-700 text-2xl text-[#0A0B0D] mb-3">
                {method === 'card' ? 'Deposit confirmed!' : 'Deposit initiated'}
              </h2>
              <p className="text-black/40 text-sm mb-6 leading-relaxed max-w-xs mx-auto">
                {method === 'bank' ? "We'll notify you once your bank transfer arrives. This typically takes 1 to 3 business days." :
                 method === 'card' ? 'Your funds are now available in your account.' :
                 "We'll notify you once we detect your crypto transaction on-chain. This usually takes 10 to 30 minutes."}
              </p>
              {(method === 'bank' || method === 'crypto') && (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 border border-black/8 mb-8">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B] dot-pulse" />
                  <span className="text-xs text-black/50">Waiting for confirmation</span>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Link to="/dashboard" className="btn-primary py-3 rounded-xl text-sm">Back to dashboard</Link>
                <Link to="/transactions" className="btn-ghost py-3 rounded-xl text-sm">View transactions</Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex items-center gap-3 mt-8">
              {step > 1 && (
                <button onClick={back} className="btn-ghost px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <button onClick={next} className="btn-primary flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                {step === 3 ? 'Confirm' : 'Continue'} <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
