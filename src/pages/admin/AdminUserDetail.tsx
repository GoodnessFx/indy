import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, AlertTriangle, Trash2, ShieldCheck, ShieldAlert,
  CreditCard, Plus, X, RefreshCw, Check, Clock,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { adminUsers } from "../../data/mock";
import CardVisual from "../../components/CardVisual";
import {
  fetchUserRecord,
  saveUserRecord,
  deleteUser,
  fetchAuditLog,
  type UserRecord,
  type PayoutCard,
  type AuditEntry,
} from "../../lib/userRecords";
import { fetchSharedUsers } from "../../lib/notes";

// Admin console for a single client. Every action here writes through to the
// shared backend (so it reaches that client on any device) and appends an
// audit-trail entry — there is no quiet edit of identity, KYC or money fields.
//
// CARD DATA RULE: cards are stored as brand + cardholder + expiry + last4.
// There is deliberately no field for a full card number; a PAN must never be
// stored, rendered, or committed.

const KYC_STATES = [
  { key: "unverified", label: "Unverified", tone: "text-black/40 border-black/15" },
  { key: "pending", label: "Pending", tone: "text-[#F59E0B] border-[#F59E0B]/30" },
  { key: "verified", label: "Verified", tone: "text-[#22C55E] border-[#22C55E]/30" },
  { key: "rejected", label: "Rejected", tone: "text-[#EF4444] border-[#EF4444]/30" },
] as const;

const emptyCard = { label: "", brand: "", cardholder: "", expiry: "", last4: "", currency: "USD" };

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // The route id can be a mock id (u-001) or an email for a real signup.
  const mock = adminUsers.find(u => u.id === id);
  const email = mock?.email ?? (id && id.includes("@") ? id : "");

  const [rec, setRec] = useState<UserRecord | null>(null);
  const [logins, setLogins] = useState<{ at: string; method: string }[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [savedAt, setSavedAt] = useState("");

  // profile edit state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  // balance adjustment state
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // card form state
  const [showCardForm, setShowCardForm] = useState(false);
  const [card, setCard] = useState(emptyCard);
  const [cardError, setCardError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = async () => {
    if (!email) { setLoading(false); setErr("Unknown user id"); return; }
    setLoading(true);
    const r = await fetchUserRecord(email);
    setRec(r);
    setName(r.profile?.name ?? "");
    setPhone(r.profile?.phone ?? "");
    setCountry(r.profile?.country ?? "");
    const all = await fetchSharedUsers();
    const mine = all.find(u => u.email.toLowerCase() === email.toLowerCase());
    setLogins(mine?.logins ?? []);
    setAudit((await fetchAuditLog()).filter(a => a.target.toLowerCase() === email.toLowerCase()));
    setLoading(false);
  };

  useEffect(() => { void refresh(); /* eslint-disable-next-line */ }, [id]);

  const flag = (msg: string) => { setSavedAt(msg); window.setTimeout(() => setSavedAt(""), 3500); };

  if (!email) {
    return (
      <AdminLayout>
        <div className="max-w-4xl text-center py-20">
          <p className="text-sm text-black/40 font-mono mb-4">That user could not be found.</p>
          <Link to="/admin/users" className="text-xs text-[#2F6BFF] font-mono">Back to users</Link>
        </div>
      </AdminLayout>
    );
  }

  const kyc = rec?.kyc || (mock?.kyc as UserRecord["kyc"]) || "";

  const saveProfile = async () => {
    if (!rec) return;
    const next: UserRecord = { ...rec, profile: { ...(rec.profile ?? {}), name, phone, country } };
    setRec(next);
    await saveUserRecord(next, { action: "Update profile", detail: { name, phone, country } });
    void refresh();
    flag("Profile saved");
  };

  const setKyc = async (state: UserRecord["kyc"]) => {
    if (!rec) return;
    const next: UserRecord = { ...rec, kyc };
    setRec(next);
    await saveUserRecord(next, { action: "Update verification", detail: { from: rec.kyc || "none", to: state } });
    void refresh();
    flag("Verification updated");
  };

  const adjustBalance = async () => {
    if (!rec || !adjAmount || !adjReason.trim()) return;
    const amount = Number(adjAmount);
    if (!Number.isFinite(amount)) return;
    const entry = {
      id: `adj-${Date.now().toString(36)}`,
      amount,
      reason: adjReason.trim(),
      at: new Date().toISOString(),
      admin: "admin",
    };
    const next: UserRecord = {
      ...rec,
      balanceAdjustments: [entry, ...(rec.balanceAdjustments ?? [])],
    };
    setRec(next);
    await saveUserRecord(next, {
      action: "Balance adjustment",
      detail: { amount, reason: entry.reason },
    });
    setAdjAmount("");
    setAdjReason("");
    setAdjusting(false);
    void refresh();
    flag("Adjustment applied and logged");
  };

  const addCard = async () => {
    if (!rec) return;
    const last4 = card.last4.replace(/\D/g, "");
    if (last4.length !== 4) { setCardError("Enter the last 4 digits of the card."); return; }
    if (!card.cardholder.trim()) { setCardError("Cardholder name is required."); return; }
    const entry: PayoutCard = {
      id: `pc-${Date.now().toString(36)}`,
      label: card.label || "Saved card",
      brand: card.brand || "Visa",
      cardholder: card.cardholder.trim().toUpperCase(),
      expiry: card.expiry,
      last4,
      currency: card.currency || "USD",
      isDefault: (rec.payout ?? []).length === 0,
      addedAt: new Date().toISOString(),
    };
    const next: UserRecord = { ...rec, payout: [...(rec.payout ?? []), entry] };
    setRec(next);
    await saveUserRecord(next, { action: "Add payout card", detail: { brand: entry.brand, last4 } });
    setCard(emptyCard);
    setCardError("");
    setShowCardForm(false);
    void refresh();
    flag("Card saved (last 4 digits only)");
  };

  const removeCard = async (cardId: string) => {
    if (!rec) return;
    const next: UserRecord = { ...rec, payout: (rec.payout ?? []).filter(c => c.id !== cardId) };
    setRec(next);
    await saveUserRecord(next, { action: "Remove payout card", detail: { cardId } });
    void refresh();
    flag("Card removed");
  };

  const doDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await deleteUser(email);
    navigate("/admin/users");
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <Link to="/admin/users" className="flex items-center gap-2 text-xs text-black/30 hover:text-black/70 font-mono">
            <ArrowLeft size={12} /> Back to users
          </Link>
          <button onClick={() => void refresh()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/8 text-[11px] text-black/40 hover:text-black/70 transition-colors font-mono">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-mono font-700 text-xl text-[#0A0B0D]">
              {rec?.profile?.name || name || mock?.name || email.split("@")[0]}
            </h1>
            <p className="text-xs text-black/35 font-mono mt-1">{email}</p>
          </div>
          {savedAt && (
            <span className="flex items-center gap-1.5 text-xs text-[#22C55E] font-mono">
              <Check size={12} /> {savedAt}
            </span>
          )}
        </div>

        {loading && <p className="text-xs text-black/35 font-mono py-8">Loading account…</p>}
        {err && <p className="text-xs text-[#EF4444] font-mono py-4">{err}</p>}

        {rec && !loading && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* profile */}
              <div className="bg-white border border-black/5 rounded-xl p-5">
                <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider mb-4">User details</h3>
                <div className="space-y-3">
                  {[
                    { label: "Name", v: name, set: setName },
                    { label: "Phone", v: phone, set: setPhone },
                    { label: "Country", v: country, set: setCountry },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-[10px] text-black/30 mb-1 font-mono">{f.label.toUpperCase()}</label>
                      <input value={f.v} onChange={e => f.set(e.target.value)}
                        className="w-full bg-black/3 border border-black/5 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/40 transition-colors" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[10px] text-black/30 mb-1 font-mono">EMAIL</label>
                    <input defaultValue={email} readOnly
                      className="w-full bg-black/3 border border-black/5 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono opacity-40 cursor-not-allowed" />
                  </div>
                  <button onClick={() => void saveProfile()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2F6BFF]/15 text-xs text-[#2F6BFF] font-mono hover:bg-[#2F6BFF]/25 transition-colors">
                    <Save size={11} /> Save changes
                  </button>
                </div>
              </div>

              {/* verification */}
              <div className="bg-white border border-black/5 rounded-xl p-5">
                <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider mb-4">Verification</h3>
                <p className="text-[11px] text-black/40 mb-3">Current: <span className="font-mono">{kyc || "unverified"}</span></p>
                <div className="grid grid-cols-2 gap-2">
                  {KYC_STATES.map(s => (
                    <button key={s.key} onClick={() => void setKyc(s.key as UserRecord["kyc"])}
                      className={`px-3 py-2 rounded-lg border text-[11px] font-mono transition-colors ${
                        kyc === s.key ? `${s.tone} bg-current/0 font-700` : "border-black/8 text-black/40 hover:text-black/70"
                      }`}>
                      {kyc === s.key && <Check size={10} className="inline mr-1" />}
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-black/25 mt-3 leading-relaxed">
                  Every change is written to the audit trail.
                </p>
              </div>

              {/* balance */}
              <div className="bg-white border border-black/5 rounded-xl p-5">
                <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider mb-4">Balance adjustments</h3>
                <p className="text-[11px] text-black/40 mb-3">
                  Applied total: <span className="font-mono text-[#0A0B0D]">
                    ${(rec.balanceAdjustments ?? []).reduce((s, a) => s + a.amount, 0).toFixed(2)}
                  </span>
                </p>
                {!adjusting ? (
                  <button onClick={() => setAdjusting(true)}
                    className="text-xs text-[#EF4444]/70 hover:text-[#EF4444] font-mono transition-colors">
                    Adjust balance (requires reason)
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input type="number" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} placeholder="Amount (use negative to debit)"
                      className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/40" />
                    <textarea value={adjReason} onChange={e => setAdjReason(e.target.value)} rows={2}
                      placeholder="Required: reason (written to the audit log)"
                      className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/40 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => void adjustBalance()} disabled={!adjAmount || !adjReason.trim()}
                        className="px-3 py-1.5 rounded-lg bg-[#EF4444]/15 text-xs text-[#EF4444] font-mono hover:bg-[#EF4444]/25 disabled:opacity-30 transition-colors">
                        Submit adjustment
                      </button>
                      <button onClick={() => setAdjusting(false)} className="text-xs text-black/30 hover:text-black/60">Cancel</button>
                    </div>
                  </div>
                )}
                {(rec.balanceAdjustments ?? []).length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-black/5 pt-3">
                    {(rec.balanceAdjustments ?? []).slice(0, 5).map(a => (
                      <div key={a.id} className="text-[10px] font-mono text-black/45">
                        <span className={a.amount >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}>
                          {a.amount >= 0 ? "+" : ""}{a.amount.toFixed(2)}
                        </span> · {a.reason}
                        <span className="text-black/25"> {new Date(a.at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* saved cards */}
            <div className="bg-white border border-black/5 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={13} /> Saved cards
                </h3>
                <button onClick={() => setShowCardForm(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2F6BFF]/15 text-[11px] text-[#2F6BFF] font-mono hover:bg-[#2F6BFF]/25 transition-colors">
                  {showCardForm ? <X size={11} /> : <Plus size={11} />}
                  {showCardForm ? "Cancel" : "Add card"}
                </button>
              </div>

              {showCardForm && (
                <div className="mb-5 p-4 rounded-xl bg-black/2 border border-black/6">
                  <p className="text-[10px] text-black/35 font-mono mb-3">
                    Last four digits only — this console cannot accept or store a full card number.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { k: "brand" as const, label: "BRAND", ph: "Chase Visa Debit" },
                      { k: "cardholder" as const, label: "CARDHOLDER", ph: "MIGUEL A RODRIGUEZ" },
                      { k: "expiry" as const, label: "EXPIRY", ph: "07/30" },
                      { k: "last4" as const, label: "LAST 4", ph: "8315" },
                      { k: "currency" as const, label: "CURRENCY", ph: "USD" },
                      { k: "label" as const, label: "LABEL", ph: "Primary debit" },
                    ].map(f => (
                      <div key={f.k}>
                        <label className="block text-[9px] text-black/30 mb-1 font-mono">{f.label}</label>
                        <input value={card[f.k]} placeholder={f.ph}
                          maxLength={f.k === "last4" ? 4 : 40}
                          onChange={e => setCard(c => ({ ...c, [f.k]: e.target.value }))}
                          className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50" />
                      </div>
                    ))}
                  </div>
                  {cardError && <p className="text-[11px] text-[#EF4444] mt-2">{cardError}</p>}
                  <button onClick={() => void addCard()}
                    className="mt-3 px-4 py-2 rounded-lg bg-[#2F6BFF] text-white text-xs font-mono hover:bg-[#4F82FF] transition-colors">
                    Save card
                  </button>
                </div>
              )}

              {(rec.payout ?? []).length === 0 ? (
                <p className="text-xs text-black/30 py-4">No card saved for this account yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(rec.payout ?? []).map(c => (
                    <div key={c.id} className="space-y-2">
                      <CardVisual card={{
                        brand: c.brand,
                        cardholder: c.cardholder,
                        expiry: c.expiry,
                        last4: c.last4,
                        currency: c.currency,
                        label: c.label,
                      }} compact />
                      <button onClick={() => void removeCard(c.id)}
                        className="flex items-center gap-1.5 text-[11px] text-[#EF4444]/70 hover:text-[#EF4444] font-mono transition-colors">
                        <Trash2 size={11} /> Remove card
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* login history + audit */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-black/5 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-black/5 flex items-center gap-2">
                  <Clock size={13} className="text-black/40" />
                  <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider">Login history ({logins.length})</h3>
                </div>
                {logins.length === 0 ? (
                  <p className="px-5 py-6 text-xs text-black/30">No sign-ins recorded yet.</p>
                ) : (
                  <div className="divide-y divide-black/3 max-h-72 overflow-y-auto">
                    {logins.map((l, i) => (
                      <div key={`${l.at}-${i}`} className="flex items-center justify-between px-5 py-2.5 gap-3">
                        <span className="text-xs text-black/60 font-mono">{new Date(l.at).toLocaleString()}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-black/45 font-mono">{l.method}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-black/5 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-black/5 flex items-center gap-2">
                  <ShieldAlert size={13} className="text-black/40" />
                  <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider">Audit trail ({audit.length})</h3>
                </div>
                {audit.length === 0 ? (
                  <p className="px-5 py-6 text-xs text-black/30">No admin changes recorded for this account.</p>
                ) : (
                  <div className="divide-y divide-black/3 max-h-72 overflow-y-auto">
                    {audit.map(a => (
                      <div key={a.id} className="px-5 py-2.5">
                        <p className="text-xs text-black/70 font-mono">{a.action}</p>
                        <p className="text-[10px] text-black/35 font-mono mt-0.5">
                          {new Date(a.at).toLocaleString()}
                          {a.detail && Object.keys(a.detail).length ? ` · ${JSON.stringify(a.detail)}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* delete */}
            <div className="mt-6 p-4 rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={12} className="text-[#EF4444]" />
                <span className="font-mono text-[10px] text-[#EF4444]">DANGER ZONE</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => void doDelete()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EF4444] text-white text-xs font-mono hover:bg-[#DC2626] transition-colors">
                  <Trash2 size={12} /> {confirmDelete ? "Click again to permanently delete" : "Delete user"}
                </button>
                {confirmDelete && (
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-black/40 hover:text-black/70">
                    Cancel
                  </button>
                )}
                <span className="text-[10px] text-black/35 font-mono">
                  Deletion is audit-logged and hides the account from the user list.
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
