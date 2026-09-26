import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight, ArrowLeft, Check, Upload, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { startGoogleSignIn, rememberProfile } from '../lib/googleAuth';
import { saveAccountProfile, fileToDataUrl } from '../lib/account';
import { recordLogin } from '../lib/audit';
import { recordSharedLogin } from '../lib/notes';

type Step = 1 | 2 | 3;

const steps = ['Account', 'Identity', 'Verification'];

const countries = ['United States','Afghanistan','Albania','Algeria','Angola','Argentina','Australia','Austria','Belgium','Brazil','Bulgaria','Canada','Chile','China','Colombia','Croatia','Czechia','Denmark','Egypt','Estonia','Finland','France','Germany','Ghana','Greece','Hong Kong','Hungary','Iceland','India','Indonesia','Ireland','Israel','Italy','Japan','Kenya','Latvia','Lithuania','Luxembourg','Malta','Mexico','Morocco','Netherlands','New Zealand','Norway','Philippines','Poland','Portugal','Qatar','Romania','Saudi Arabia','Singapore','Slovakia','South Africa','South Korea','Spain','Sweden','Switzerland','Thailand','Turkey','United Arab Emirates','United Kingdom','Vietnam'];

export default function Signup() {
  const [step, setStep] = useState<Step>(1);
  const [showPw, setShowPw] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const navigate = useNavigate();

  const handleGoogle = async () => {
    setGoogleError('');
    setGoogleLoading(true);
    try {
      const profile = await startGoogleSignIn('/dashboard');
      // null means the browser is being redirected to Google (Supabase flow).
      if (!profile) return;
      recordLogin('google', profile.email, profile.name);
      void recordSharedLogin(profile.email, profile.name, 'google');
      if (profile.email) update('email', profile.email);
      if (profile.given_name) update('firstName', profile.given_name);
      if (profile.family_name) update('lastName', profile.family_name);
      setStep(2);
    } catch (e) {
      setGoogleError(e instanceof Error ? e.message : 'Google sign-in failed. Try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const [form, setForm] = useState({
    email: '', phone: '', password: '',
    firstName: '', lastName: '', dob: '', country: '',
    idType: 'passport', idUploaded: false,
  });
  const [idDoc, setIdDoc] = useState<{ name: string; dataUrl: string } | null>(null);
  const [addressDoc, setAddressDoc] = useState<{ name: string; dataUrl: string } | null>(null);
  const [docError, setDocError] = useState('');

  const update = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const pickDoc = async (
    file: File | undefined,
    setDoc: (d: { name: string; dataUrl: string } | null) => void,
  ) => {
    if (!file) return;
    try {
      setDocError('');
      const dataUrl = await fileToDataUrl(file, 1100, 0.7);
      setDoc({ name: file.name, dataUrl });
    } catch {
      setDocError('That file could not be read. Try a JPG or PNG image.');
    }
  };

  const idTypeLabel = form.idType === 'drivers' ? "Driver's license" : form.idType === 'national' ? 'National ID' : 'Passport';

  const next = () => {
    if (step < 3) { setStep((step + 1) as Step); return; }
    if (!idDoc) {
      setDocError('Upload your ID document to finish setup. Proof of address can follow.');
      return;
    }
    // Persist the account, profile, and every uploaded document, so settings
    // already show what was captured here and the 30 minute auto verification
    // clock starts from these timestamps.
    const name = `${form.firstName} ${form.lastName}`.trim();
    const stamp = new Date().toISOString();
    const documents = [
      { kind: 'government', label: idTypeLabel, name: idDoc.name, at: stamp, dataUrl: idDoc.dataUrl },
      ...(addressDoc
        ? [{ kind: 'address', label: 'Proof of address', name: addressDoc.name, at: stamp, dataUrl: addressDoc.dataUrl }]
        : []),
    ];
    rememberProfile({ sub: `local-${Date.now()}`, email: form.email, name: name || 'Investor' });
    recordLogin('email', form.email, name || 'Investor');
    void recordSharedLogin(form.email, name || 'Investor', 'signup');
    saveAccountProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      dob: form.dob,
      country: form.country,
      phone: form.phone,
      email: form.email,
      idType: form.idType,
      documents,
    });
    window.dispatchEvent(new Event('indy-auth'));
    navigate('/dashboard');
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
            <Logo size={48} />
            <span className="font-display font-800 text-2xl text-[#0A0B0D]">Indy <span className="text-[#2F6BFF]">Digital Marketing Solutions</span></span>
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
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="btn-ghost py-3 rounded-xl text-sm flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.8 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.2-3.9z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.8 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.7-.2-3.9z" />
                  </svg>
                  {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
                </button>
              </div>
              {googleError && (
                <p className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-4 py-3">{googleError}</p>
              )}
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

          {/* Step 3, real document uploads, saved to the profile on completion */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-display font-600 text-lg text-[#0A0B0D] mb-2">Upload your documents</h2>
              <p className="text-sm text-black/40">Photograph each page straight on. JPG or PNG from your device. Every upload is kept on your profile and moves to verified 30 minutes later.</p>

              <label
                className={`block w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 transition-all cursor-pointer ${
                  idDoc
                    ? 'border-[#22C55E] bg-[#22C55E]/5'
                    : 'border-black/15 hover:border-[#2F6BFF]/50 hover:bg-[#2F6BFF]/5'
                }`}
              >
                {idDoc ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                      <Check size={20} className="text-[#22C55E]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[#22C55E] font-medium truncate max-w-[260px]">{idDoc.name}</p>
                      <p className="text-xs text-black/30 mt-1">{idTypeLabel} captured, tap to retake</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center">
                      <Upload size={20} className="text-black/40" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-black/60 font-medium">Capture your {idTypeLabel}</p>
                      <p className="text-xs text-black/30 mt-1">Required, JPG or PNG</p>
                    </div>
                  </>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={e => pickDoc(e.target.files?.[0], setIdDoc)} />
              </label>

              <label
                className={`block w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 transition-all cursor-pointer ${
                  addressDoc
                    ? 'border-[#22C55E] bg-[#22C55E]/5'
                    : 'border-black/15 hover:border-[#2F6BFF]/50 hover:bg-[#2F6BFF]/5'
                }`}
              >
                {addressDoc ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                      <Check size={20} className="text-[#22C55E]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[#22C55E] font-medium truncate max-w-[260px]">{addressDoc.name}</p>
                      <p className="text-xs text-black/30 mt-1">Proof of address captured, tap to retake</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center">
                      <Upload size={20} className="text-black/40" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-black/60 font-medium">Capture a proof of address</p>
                      <p className="text-xs text-black/30 mt-1">Utility bill or bank statement, optional now, add later in Settings</p>
                    </div>
                  </>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={e => pickDoc(e.target.files?.[0], setAddressDoc)} />
              </label>

              {docError && (
                <p className="text-xs text-[#D97706] leading-relaxed">{docError}</p>
              )}

              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/20">
                <div className="w-4 h-4 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] text-[#F59E0B] font-bold">i</span>
                </div>
                <p className="text-xs text-[#F59E0B]/80 leading-relaxed">
                  Documents stay pending for 30 minutes after upload while checks run, then flip to verified automatically. You can invest and explore in the meantime.
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
