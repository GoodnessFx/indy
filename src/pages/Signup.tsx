import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight, ArrowLeft, Check, Upload, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

type Step = 1 | 2 | 3;

const steps = ['Account', 'Identity', 'Verification'];

const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'Brazil', 'United Arab Emirates', 'Singapore', 'Nigeria', 'India', 'Australia'];

export default function Signup() {
  const [step, setStep] = useState<Step>(1);
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', phone: '', password: '',
    firstName: '', lastName: '', dob: '', country: '',
    idType: 'passport', idUploaded: false,
  });

  const update = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const next = () => {
    if (step < 3) setStep((step + 1) as Step);
    else navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-6 relative overflow-hidden py-24">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7F7F5] via-[#0d1020] to-white" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <Logo size={40} />
            <span className="font-display font-700 text-lg text-[#0A0B0D]">Indy<span className="text-[#2F6BFF]">Solutions</span></span>
          </Link>
          <h1 className="font-display font-700 text-3xl text-[#0A0B0D] mb-2">Create your account</h1>
          <p className="text-black/40 text-sm">Start investing in under 3 minutes</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-600 font-mono transition-all ${
                  i + 1 < step ? 'bg-[#22C55E] text-white' :
                  i + 1 === step ? 'bg-[#2F6BFF] text-white' :
                  'bg-black/10 text-black/30'
                }`}>
                  {i + 1 < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${i + 1 === step ? 'text-[#0A0B0D]' : 'text-black/30'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 mx-2 mb-4 transition-all ${i + 1 < step ? 'bg-[#22C55E]' : 'bg-black/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl border border-black/8 p-8">
          {/* Step 1, Account */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display font-600 text-lg text-[#0A0B0D] mb-6">Account details</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-ghost py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                  <span className="font-mono text-xs">G</span> Google
                </button>
                <button className="btn-ghost py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                  Apple
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-black/8" />
                <span className="text-xs text-black/30">or</span>
                <div className="flex-1 h-px bg-black/8" />
              </div>
              {[
                { label: 'Email address', key: 'email', type: 'email', placeholder: 'you@example.com' },
                { label: 'Phone number', key: 'phone', type: 'tel', placeholder: '+1 555 0123' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-black/50 mb-2">{field.label}</label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form] as string}
                    onChange={e => update(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] placeholder-black/20 outline-none focus:border-[#2F6BFF] transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-black/50 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 pr-12 text-sm text-[#0A0B0D] placeholder-black/20 outline-none focus:border-[#2F6BFF] transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`flex-1 h-1 rounded-full ${form.password.length > i * 2 + 3 ? 'bg-[#22C55E]' : 'bg-black/10'}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2, KYC */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display font-600 text-lg text-[#0A0B0D] mb-6">Identity verification</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'firstName', label: 'First name', placeholder: 'Marcus' },
                  { key: 'lastName', label: 'Last name', placeholder: 'Chen' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-black/50 mb-2">{f.label}</label>
                    <input
                      type="text"
                      value={form[f.key as keyof typeof form] as string}
                      onChange={e => update(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] placeholder-black/20 outline-none focus:border-[#2F6BFF] transition-colors"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-black/50 mb-2">Date of birth</label>
                <input type="date" value={form.dob} onChange={e => update('dob', e.target.value)}
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF] transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-black/50 mb-2">Country of residence</label>
                <select value={form.country} onChange={e => update('country', e.target.value)}
                  className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF] transition-colors">
                  <option value="">Select country</option>
                  {countries.map(c => <option key={c} value={c} className="bg-white">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-black/50 mb-2">Document type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['passport', 'drivers', 'national'].map(type => (
                    <button key={type} onClick={() => update('idType', type)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors capitalize ${
                        form.idType === type ? 'border-[#2F6BFF] text-[#2F6BFF] bg-[#2F6BFF]/10' : 'border-black/10 text-black/40 hover:border-black/20'
                      }`}>
                      {type === 'drivers' ? "Driver's" : type === 'national' ? 'National ID' : 'Passport'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3, Document upload */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-display font-600 text-lg text-[#0A0B0D] mb-2">Upload your document</h2>
              <p className="text-sm text-black/40">Upload a clear photo of your {form.idType || 'ID'}. All documents are encrypted and stored securely.</p>

              <button
                onClick={() => update('idUploaded', true)}
                className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 transition-all ${
                  form.idUploaded
                    ? 'border-[#22C55E] bg-[#22C55E]/5'
                    : 'border-black/15 hover:border-[#2F6BFF]/50 hover:bg-[#2F6BFF]/5'
                }`}
              >
                {form.idUploaded ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                      <Check size={20} className="text-[#22C55E]" />
                    </div>
                    <p className="text-sm text-[#22C55E] font-medium">Document uploaded</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center">
                      <Upload size={20} className="text-black/40" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-black/60 font-medium">Click to upload</p>
                      <p className="text-xs text-black/30 mt-1">JPG, PNG, PDF, max 10MB</p>
                    </div>
                  </>
                )}
              </button>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20">
                <div className="w-4 h-4 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] text-[#F59E0B] font-bold">i</span>
                </div>
                <p className="text-xs text-[#F59E0B]/80 leading-relaxed">
                  Document verification typically takes 1 to 2 business days. You can browse and explore the platform while we review.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep((step - 1) as Step)} className="btn-ghost px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button onClick={next} className="btn-primary flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              {step === 3 ? 'Complete setup' : 'Continue'} <ArrowRight size={15} />
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-black/40 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2F6BFF] hover:text-[#4F82FF]">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
