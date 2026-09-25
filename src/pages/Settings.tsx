import { useState } from 'react';
import { User, Shield, Settings as SettingsIcon, CreditCard, BadgeCheck, AlertTriangle, Upload, Check, Eye, EyeOff, Globe, QrCode, ScanLine, FileDown, Gift, Copy } from 'lucide-react';
import { languages } from '../data/mock';
import ScanCardModal from '../components/ScanCardModal';
import { getPayoutMethods, removePayoutMethod, type PayoutMethod } from '../lib/payoutMethods';
import { getReferralCode } from '../lib/watchlist';
import { myOrders } from '../lib/orders';
import { useAuth } from '../lib/useAuth';
import { fileToDataUrl, saveAccountProfile, exportAccountData, getAccountProfile } from '../lib/account';
import { pushUserNote } from '../lib/notes';

type Tab = 'profile' | 'security' | 'preferences' | 'payments' | 'verification' | 'danger';

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
  { id: 'payments', label: 'Payment Methods', icon: CreditCard },
  { id: 'verification', label: 'Verification', icon: BadgeCheck },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>('profile');
  const [twoFaEnabled, setTwoFaEnabled] = useState(true);
  const [notifications, setNotifications] = useState({
    emailDeposit: true, emailWithdrawal: true, emailSecurity: true,
    pushDeposit: false, pushWithdrawal: true, pushSecurity: true,
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [savedProfile, setSavedProfile] = useState(false);
  const [methods, setMethods] = useState<PayoutMethod[]>(() => getPayoutMethods());
  const [scanOpen, setScanOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statementDone, setStatementDone] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(getAccountProfile().avatar);
  const [docPreview, setDocPreview] = useState<Record<string, string>>({});
  const referralCode = getReferralCode();

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return;
    try {
      const data = await fileToDataUrl(file, 320, 0.78);
      setAvatar(data);
      saveAccountProfile({ avatar: data, avatarName: file.name });
      pushUserNote('Profile photo updated');
    } catch { /* invalid image */ }
  };

  const uploadDocument = async (kind: string, label: string, file: File | undefined) => {
    if (!file) return;
    try {
      const data = await fileToDataUrl(file, 1100, 0.7);
      setDocPreview(d => ({ ...d, [kind]: data }));
      const p = getAccountProfile();
      const documents = [
        ...p.documents.filter(d => d.kind !== kind),
        { kind, label, name: file.name, at: new Date().toISOString(), dataUrl: data },
      ];
      saveAccountProfile({ documents });
      pushUserNote(`${label} uploaded for review`);
    } catch { /* invalid image */ }
  };
  const { profile } = useAuth();
  const fullName = (profile?.name || profile?.email || 'Account').trim();
  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ') || profile?.family_name || '';
  const profileInitial = fullName.charAt(0).toUpperCase();

  const copyReferral = async () => {
    const link = `https://indysolutions.com/signup?ref=${referralCode}`;
    try {
      await navigator.clipboard?.writeText(link);
    } catch { /* clipboard unavailable, the code is still visible */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadStatement = () => {
    const rows = myOrders().map(o =>
      [o.createdAt, o.id, `${o.kind} investment: ${o.assetName}`, o.currency, o.amount, (o.amount * 0.01).toFixed(2), o.status].join(',')
    );
    const csv = [
      'Date,Reference,Description,Asset,Amount,Fee,Status',
      ...rows,
      '',
      `Referral code,${referralCode}`,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'indysolutions-statement.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatementDone(true);
    setTimeout(() => setStatementDone(false), 2500);
  };

  const saveProfile = () => { setSavedProfile(true); setTimeout(() => setSavedProfile(false), 2000); };

  return (
    <div className="min-h-screen bg-[#F7F7F5] pt-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
        <h1 className="font-display font-700 text-3xl text-[#0A0B0D] mb-8">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          {/* Tab list */}
          <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 lg:w-full ${
                  tab === id
                    ? id === 'danger' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#2F6BFF]/10 text-[#2F6BFF]'
                    : id === 'danger' ? 'text-[#EF4444]/60 hover:text-[#EF4444] hover:bg-[#EF4444]/5' : 'text-black/50 hover:text-black hover:bg-black/5'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="glass rounded-2xl border border-black/8 p-8">
            {tab === 'profile' && (
              <div>
                <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-6">Profile</h2>
                {/* Avatar, upload from the device */ }
                <div className="flex items-center gap-5 mb-8">
                  <div className="relative">
                    <label className="block cursor-pointer">
                      {avatar ? (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden">
                          <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-[#2F6BFF]/20 flex items-center justify-center text-3xl font-medium text-[#2F6BFF]">{profileInitial}</div>
                      )}
                      <input type="file" accept="image/*" className="sr-only" onChange={e => uploadAvatar(e.target.files?.[0])} />
                    </label>
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-[#2F6BFF] flex items-center justify-center hover:bg-[#4F82FF] transition-colors cursor-pointer">
                      <Upload size={12} className="text-[#0A0B0D]" />
                      <input type="file" accept="image/*" className="sr-only" onChange={e => uploadAvatar(e.target.files?.[0])} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0A0B0D]">Profile photo</p>
                    <p className="text-xs text-black/30 mt-1">Choose an image from your device. Only you and support see it.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { label: 'First name', value: firstName || '', type: 'text' },
                    { label: 'Last name', value: lastName, type: 'text' },
                    { label: 'Display name / username', value: fullName.toLowerCase().replace(/[^a-z0-9]+/g, ''), type: 'text' },
                    { label: 'Email address', value: profile?.email || '', type: 'email' },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="block text-xs text-black/40 mb-2">{field.label}</label>
                      <input type={field.type} defaultValue={field.value}
                        className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF] transition-colors" />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <label className="block text-xs text-black/40 mb-2">Country</label>
                    <select className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF] transition-colors">
                      <option className="bg-white">United States</option>
                    </select>
                  </div>
                </div>

                <button onClick={saveProfile} className={`mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-display font-600 transition-all ${savedProfile ? 'bg-[#22C55E] text-white' : 'btn-primary'}`}>
                  {savedProfile ? <><Check size={15} /> Saved!</> : 'Save changes'}
                </button>
              </div>
            )}

            {tab === 'security' && (
              <div>
                <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-6">Security</h2>

                {/* Password change */}
                <div className="mb-8 p-6 rounded-xl bg-black/3 border border-black/8">
                  <h3 className="font-display font-600 text-base text-[#0A0B0D] mb-5">Change password</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Current password', show: showCurrentPw, setShow: setShowCurrentPw },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-xs text-black/40 mb-2">{f.label}</label>
                        <div className="relative">
                          <input type={f.show ? 'text' : 'password'} placeholder="********"
                            className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 pr-12 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF] transition-colors" />
                          <button type="button" onClick={() => f.setShow(!f.show)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60">
                            {f.show ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    {[
                      { label: 'New password', placeholder: 'Min. 8 characters' },
                      { label: 'Confirm new password', placeholder: '********' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="block text-xs text-black/40 mb-2">{f.label}</label>
                        <input type="password" placeholder={f.placeholder}
                          className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF] transition-colors" />
                      </div>
                    ))}
                    <button className="btn-primary px-5 py-2.5 rounded-xl text-sm">Update password</button>
                  </div>
                </div>

                {/* 2FA */}
                <div className="mb-8 p-6 rounded-xl bg-black/3 border border-black/8">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-display font-600 text-base text-[#0A0B0D]">Two-factor authentication</h3>
                      <p className="text-xs text-black/30 mt-1">Authenticator app + SMS backup</p>
                    </div>
                    <button
                      onClick={() => setTwoFaEnabled(!twoFaEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative ${twoFaEnabled ? 'bg-[#22C55E]' : 'bg-black/10'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${twoFaEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  {twoFaEnabled && (
                    <div className="flex items-center gap-2 mt-3">
                      <Check size={13} className="text-[#22C55E]" />
                      <span className="text-xs text-[#22C55E]">2FA is active. Your account is protected.</span>
                    </div>
                  )}
                </div>

                  <div className="p-6 rounded-xl bg-black/3 border border-black/8">
                    <h3 className="font-display font-600 text-base text-[#0A0B0D] mb-3">Login history</h3>
                    <p className="text-xs text-black/30 leading-relaxed">
                      Sign-ins on this account are recorded and reviewed by the support and compliance team.
                      A full timeline is available to that team from the admin console; individual device
                      sessions are only shown there once full session tracking is live in your region.
                    </p>
                  </div>
                </div>
              )}

            {tab === 'preferences' && (
              <div>
                <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-6">Preferences</h2>

                <div className="space-y-6">
                  <div className="py-4">
                    <p className="text-sm font-medium text-[#0A0B0D] mb-3">Display currency</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['USD', 'EUR', 'GBP', 'AED'].map(c => (
                        <button key={c} onClick={() => setCurrency(c)}
                          className={`py-2.5 rounded-xl text-sm font-mono font-600 transition-colors ${
                            currency === c ? 'bg-[#2F6BFF] text-white' : 'bg-black/5 text-black/40 hover:text-black hover:bg-black/10'
                          }`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="py-4 border-b border-black/5">
                    <p className="text-sm font-medium text-[#0A0B0D] mb-3">Language</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {languages.map(lang => (
                        <button key={lang.code} onClick={() => setLanguage(lang.code)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                            language === lang.code ? 'bg-[#2F6BFF]/15 text-[#2F6BFF] border border-[#2F6BFF]/30' : 'bg-black/5 text-black/50 border border-transparent hover:text-black hover:bg-black/10'
                          }`}>
                          <Globe size={13} className="text-black/30" />
                          <span>{lang.script}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="py-4">
                    <p className="text-sm font-medium text-[#0A0B0D] mb-4">Notifications</p>
                    <div className="space-y-3">
                      {[
                        { key: 'emailDeposit', label: 'Email: Deposit received' },
                        { key: 'emailWithdrawal', label: 'Email: Withdrawal updates' },
                        { key: 'emailSecurity', label: 'Email: Security alerts' },
                        { key: 'pushDeposit', label: 'Push: Deposit received' },
                        { key: 'pushWithdrawal', label: 'Push: Withdrawal updates' },
                        { key: 'pushSecurity', label: 'Push: Security alerts' },
                      ].map(n => (
                        <div key={n.key} className="flex items-center justify-between">
                          <p className="text-sm text-black/60">{n.label}</p>
                          <button
                            onClick={() => setNotifications(p => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                            className={`w-10 h-5 rounded-full transition-all relative ${notifications[n.key as keyof typeof notifications] ? 'bg-[#2F6BFF]' : 'bg-black/10'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${notifications[n.key as keyof typeof notifications] ? 'left-5.5' : 'left-0.5'}`} style={{ left: notifications[n.key as keyof typeof notifications] ? '22px' : '2px' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'payments' && (
              <div>
                <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-6">Payment Methods</h2>
                <div className="space-y-3 mb-6">
                  {methods.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between p-4 rounded-xl border border-black/8 bg-black/3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                          <CreditCard size={16} className="text-black/40" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0A0B0D]">{acc.label} ****{acc.last4}</p>
                          <p className="text-xs text-black/30 mt-0.5">{acc.type === 'bank' ? 'Bank account' : 'Debit card'}, {acc.currency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {acc.isDefault && <span className="text-xs chip-accent px-2.5 py-1 rounded-full">Default</span>}
                        <button
                          onClick={() => { removePayoutMethod(acc.id); setMethods(getPayoutMethods()); }}
                          className="text-xs text-[#EF4444]/60 hover:text-[#EF4444] transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setScanOpen(true)}
                  className="flex items-center gap-2 border border-dashed border-black/15 rounded-xl px-5 py-3 text-sm text-black/40 hover:text-black/70 hover:border-black/30 transition-colors"
                >
                  <ScanLine size={15} /> Scan or add a card
                </button>
                <p className="text-xs text-black/30 mt-3 leading-relaxed">
                  Cards added here are available to select when you withdraw, so you do not need to rescan each time.
                </p>

                {/* Statements and referrals live next to money movement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="rounded-2xl border border-black/8 bg-black/3 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <FileDown size={15} className="text-[#2F6BFF]" />
                      <h3 className="font-display font-600 text-sm text-[#0A0B0D]">Account statement</h3>
                    </div>
                    <p className="text-xs text-black/40 leading-relaxed mb-4">
                      Download a dated record of every transaction, fee, and holding for your own files.
                    </p>
                    <button
                      onClick={downloadStatement}
                      className="px-5 py-2.5 rounded-xl bg-[#2F6BFF] text-sm text-white hover:bg-[#4F82FF] transition-colors"
                    >
                      {statementDone ? 'Downloaded' : 'Download statement'}
                    </button>
                  </div>
                  <div className="rounded-2xl border border-black/8 bg-black/3 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift size={15} className="text-[#F59E0B]" />
                      <h3 className="font-display font-600 text-sm text-[#0A0B0D]">Refer a friend</h3>
                    </div>
                    <p className="text-xs text-black/40 leading-relaxed mb-4">
                      Share your link. You both receive a fee discount once their first deposit clears.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-mono text-xs bg-white border border-black/10 rounded-xl px-3 py-2.5 text-[#0A0B0D] truncate">
                        {referralCode}
                      </span>
                      <button
                        onClick={copyReferral}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/15 text-xs text-black/60 hover:border-black/30 transition-colors"
                      >
                        <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'verification' && (
              <div>
                <h2 className="font-display font-600 text-xl text-[#0A0B0D] mb-6">Identity Verification</h2>
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#22C55E]/8 border border-[#22C55E]/20 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-[#22C55E]/15 flex items-center justify-center">
                    <BadgeCheck size={22} className="text-[#22C55E]" />
                  </div>
                  <div>
                    <p className="font-display font-600 text-base text-[#0A0B0D]">Identity verified</p>
                    <p className="text-xs text-[#22C55E]/70 mt-0.5">Your account is fully KYC verified and in good standing.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { kind: 'government', label: 'Government ID' },
                    { kind: 'selfie', label: 'Selfie verification' },
                    { kind: 'address', label: 'Proof of address' },
                  ].map(doc => (
                    <div key={doc.kind} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-black/8 bg-black/3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#0A0B0D]">{doc.label}</p>
                        <p className="text-xs text-black/30 mt-0.5 truncate">
                          {getAccountProfile().documents.find(d => d.kind === doc.kind)?.name || (docPreview[doc.kind] ? 'Uploaded, pending review' : 'Not uploaded yet')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="flex items-center gap-1.5 text-xs border border-black/15 rounded-lg px-3 py-2 text-black/60 hover:border-black/30 cursor-pointer">
                          <Upload size={12} /> Upload
                          <input type="file" accept="image/*" className="sr-only"
                            onChange={e => uploadDocument(doc.kind, doc.label, e.target.files?.[0])} />
                        </label>
                        <span className={
                          getAccountProfile().documents.find(d => d.kind === doc.kind) || docPreview[doc.kind]
                            ? 'text-xs chip-warning px-2.5 py-1 rounded-full'
                            : 'text-xs px-2.5 py-1 rounded-full border border-black/10 text-black/30'
                        }>
                          {getAccountProfile().documents.find(d => d.kind === doc.kind) || docPreview[doc.kind] ? 'Pending' : 'Missing'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'danger' && (
              <div>
                <h2 className="font-display font-600 text-xl text-[#EF4444] mb-6">Danger Zone</h2>
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5">
                    <h3 className="font-display font-600 text-base text-[#0A0B0D] mb-2">Download my data</h3>
                    <p className="text-xs text-black/40 mb-4">Export all your account data including transactions, profile, and investment history.</p>
                    <button onClick={() => { exportAccountData(); }}
                      className="px-5 py-2.5 rounded-xl border border-black/15 text-sm text-black/70 hover:text-black hover:border-black/30 transition-colors">
                      Download my data
                    </button>
                  </div>
                  <div className="p-5 rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5">
                    <h3 className="font-display font-600 text-base text-[#0A0B0D] mb-2">Deactivate account</h3>
                    <p className="text-xs text-black/40 mb-4">Temporarily disable your account. You can reactivate at any time.</p>
                    <button className="px-5 py-2.5 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/30 text-sm text-[#EF4444] hover:bg-[#EF4444]/30 transition-colors">
                      Deactivate account
                    </button>
                  </div>
                  <div className="p-5 rounded-2xl border border-[#EF4444]/40 bg-[#EF4444]/8">
                    <h3 className="font-display font-600 text-base text-[#EF4444] mb-2">Close account permanently</h3>
                    <p className="text-xs text-black/40 mb-4">This action is irreversible. All your data will be deleted after the mandatory 30-day retention period.</p>
                    <button className="px-5 py-2.5 rounded-xl bg-[#EF4444] text-sm text-[#0A0B0D] hover:bg-[#DC2626] transition-colors">
                      Close account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {scanOpen && (
        <ScanCardModal
          onClose={() => setScanOpen(false)}
          onSaved={() => { setMethods(getPayoutMethods()); setScanOpen(false); }}
        />
      )}
    </div>
  );
}
