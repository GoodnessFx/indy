import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, AlertTriangle, Trash2, ShieldCheck, ShieldAlert,
  CreditCard, Plus, X, RefreshCw, Check, Clock, Tag, Package, Receipt,
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
  type ServiceFeeChange,
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
  // "set balance to $X" (absolute) state
  const [setBalValue, setSetBalValue] = useState("");
  const [setBalReason, setSetBalReason] = useState("");
  const [settingBal, setSettingBal] = useState(false);
  // mark-an-asset-as-sold state
  const [soldName, setSoldName] = useState("");
  const [soldAmount, setSoldAmount] = useState("");
  const [soldReason, setSoldReason] = useState("");
  const [showSoldForm, setShowSoldForm] = useState(false);
  const [markingSold, setMarkingSold] = useState(false);
  const [soldError, setSoldError] = useState("");

  // card form state
  const [showCardForm, setShowCardForm] = useState(false);
  const [card, setCard] = useState(emptyCard);
  const [cardError, setCardError] = useState("");

  // service fee state
  const [feeValue, setFeeValue] = useState("");
  const [feeReason, setFeeReason] = useState("");
  const [editingFee, setEditingFee] = useState(false);
  const [savingFee, setSavingFee] = useState(false);
  const [feeError, setFeeError] = useState("");

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

  /** Set a flat per-client service fee, replacing the platform default.
   *  The old value and the reason are written to serviceFeeHistory so there
   *  is a full change trail on this account. */
  const saveServiceFee = async () => {
    if (!rec) return;
    const parsed = Number(feeValue);
    if (!feeValue.trim() || !Number.isFinite(parsed) || parsed < 0) {
      setFeeError("Enter a valid dollar amount (0 or more).");
      return;
    }
    if (!feeReason.trim()) {
      setFeeError("A reason is required — it is written to the audit log.");
      return;
    }
    setSavingFee(true);
    setFeeError("");
    const amount = Math.round(parsed * 100) / 100;
    const change: ServiceFeeChange = {
      id: `fee-${Date.now().toString(36)}`,
      from: rec.serviceFee ?? null,
      to: amount,
      reason: feeReason.trim(),
      at: new Date().toISOString(),
      admin: "admin",
    };
    const next: UserRecord = {
      ...rec,
      serviceFee: amount,
      serviceFeeHistory: [change, ...(rec.serviceFeeHistory ?? [])],
    };
    setRec(next);
    await saveUserRecord(next, {
      action: "Set service fee",
      detail: { from: change.from, to: amount, reason: change.reason },
    });
    setFeeValue("");
    setFeeReason("");
    setEditingFee(false);
    setSavingFee(false);
    void refresh();
    flag(`Service fee set to $${amount.toFixed(2)}`);
  };

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

  /** Set the client's total portfolio value to an absolute dollar amount. This
   *  is the "TOTAL PORTFOLIO VALUE" the client sees on their dashboard, not just
   *  available cash. Records the delta (audit-logged) for the trail. */
  const setBalanceTo = async () => {
    if (!rec || setBalValue === "" || !setBalReason.trim()) return;
    const target = Number(setBalValue);
    if (!Number.isFinite(target) || target < 0) return;
    const current = typeof rec.portfolioValue === "number"
      ? rec.portfolioValue
      : (rec.balanceAdjustments ?? []).reduce((s, a) => s + a.amount, 0);
    const delta = Math.round((target - current) * 100) / 100;
    const entry = {
      id: `adj-${Date.now().toString(36)}`,
      amount: delta,
      reason: setBalReason.trim(),
      at: new Date().toISOString(),
      admin: "admin",
    };
    const next: UserRecord = {
      ...rec,
      portfolioValue: target,
      balanceAdjustments: [entry, ...(rec.balanceAdjustments ?? [])],
    };
    setRec(next);
    await saveUserRecord(next, {
      action: "Set balance",
      detail: { target, delta, reason: entry.reason },
    });
    setSetBalValue("");
    setSetBalReason("");
    setSettingBal(false);
    void refresh();
    flag("Portfolio value set and logged");
  };

  /** Mark an asset (e.g. an NFT) as sold for this client. Stored in the record
   *  so it shows as a "sell" in their transaction history and leaves their
   *  portfolio; always audit-logged with the reason. */
  const markSold = async () => {
    if (!rec || !soldName.trim()) { setSoldError("Asset name is required."); return; }
    const amount = Number(soldAmount);
    if (soldAmount !== "" && !Number.isFinite(amount)) { setSoldError("Sale amount must be a number."); return; }
    const event = {
      id: `sold-${Date.now().toString(36)}`,
      assetName: soldName.trim(),
      amount: Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0,
      currency: "USD",
      reason: soldReason.trim() || "Admin marked asset as sold",
      at: new Date().toISOString(),
      admin: "admin",
    };
    const next: UserRecord = {
      ...rec,
      soldEvents: [event, ...(rec.soldEvents ?? [])],
    };
    setRec(next);
    await saveUserRecord(next, {
      action: "Mark asset sold",
      detail: { assetName: event.assetName, amount: event.amount, reason: event.reason },
    });
    setSoldName("");
    setSoldAmount("");
    setSoldReason("");
    setSoldError("");
    setMarkingSold(false);
    setShowSoldForm(false);
    void refresh();
    flag("Asset marked as sold");
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
                <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider mb-4">Portfolio balance</h3>
                <p className="text-[11px] text-black/40 mb-3">
                  Total portfolio value: <span className="font-mono text-[#0A0B0D]">
                    ${(typeof rec.portfolioValue === "number" ? rec.portfolioValue : (rec.balanceAdjustments ?? []).reduce((s, a) => s + a.amount, 0)).toFixed(2)}
                  </span>
                </p>

                {/* Set account balance to an absolute amount */}
                {!settingBal ? (
                  <button onClick={() => setSettingBal(true)}
                    className="text-xs text-[#2F6BFF] hover:text-[#4F82FF] font-mono transition-colors">
                    Set balance to a dollar amount
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input type="number" min="0" value={setBalValue} onChange={e => setSetBalValue(e.target.value)}
                      placeholder="Target balance, e.g. 150000"
                      className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/40" />
                    <textarea value={setBalReason} onChange={e => setSetBalReason(e.target.value)} rows={2}
                      placeholder="Required: reason (written to the audit log)"
                      className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/40 resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => void setBalanceTo()} disabled={setBalValue === "" || !setBalReason.trim()}
                        className="px-3 py-1.5 rounded-lg bg-[#2F6BFF] text-white text-xs font-mono hover:bg-[#4F82FF] disabled:opacity-30 transition-colors">
                        Set balance
                      </button>
                      <button onClick={() => setSettingBal(false)} className="text-xs text-black/30 hover:text-black/60">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Adjust by a delta */}
                {!adjusting ? (
                  <button onClick={() => setAdjusting(true)}
                    className="mt-2 text-xs text-[#EF4444]/70 hover:text-[#EF4444] font-mono transition-colors">
                    Adjust by an amount (requires reason)
                  </button>
                ) : (
                  <div className="mt-2 space-y-2">
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

            {/* sold assets */}
            <div className="bg-white border border-black/5 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider flex items-center gap-2">
                  <Tag size={13} /> Sold assets
                </h3>
                <button onClick={() => setShowSoldForm(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2F6BFF]/15 text-[11px] text-[#2F6BFF] font-mono hover:bg-[#2F6BFF]/25 transition-colors">
                  {showSoldForm ? <X size={11} /> : <Plus size={11} />}
                  {showSoldForm ? "Cancel" : "Mark asset as sold"}
                </button>
              </div>

              {showSoldForm && (
                <div className="mb-5 p-4 rounded-xl bg-black/2 border border-black/6">
                  <p className="text-[10px] text-black/35 font-mono mb-3">
                    Records a sale on this account — it shows as a "sell" in the client's
                    transaction history and leaves their portfolio. Every sale is audit-logged.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input value={soldName} onChange={e => setSoldName(e.target.value)}
                      placeholder="Asset name, e.g. Bored Ape Yacht Club #7492"
                      className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50" />
                    <input type="number" min="0" value={soldAmount} onChange={e => setSoldAmount(e.target.value)}
                      placeholder="Sale amount (USD), optional"
                      className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50" />
                    <textarea value={soldReason} onChange={e => setSoldReason(e.target.value)} rows={2}
                      placeholder="Optional note (written to the audit log)"
                      className="w-full sm:col-span-2 bg-white border border-black/10 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50 resize-none" />
                  </div>
                  {soldError && <p className="text-[11px] text-[#EF4444] mt-2">{soldError}</p>}
                  <button onClick={() => void markSold()} disabled={!soldName.trim() || markingSold}
                    className="mt-3 px-4 py-2 rounded-lg bg-[#2F6BFF] text-white text-xs font-mono hover:bg-[#4F82FF] disabled:opacity-30 transition-colors">
                    {markingSold ? "Saving…" : "Mark as sold"}
                  </button>
                </div>
              )}

              {(rec.soldEvents ?? []).length === 0 ? (
                <p className="text-xs text-black/30 py-4">No assets marked as sold for this account yet.</p>
              ) : (
                <div className="space-y-2">
                  {(rec.soldEvents ?? []).map(s => (
                    <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg bg-black/2 border border-black/5 px-4 py-3">
                      <div>
                        <p className="text-xs text-black/80 font-mono flex items-center gap-1.5">
                          <Package size={12} className="text-[#22C55E]" /> {s.assetName}
                        </p>
                        <p className="text-[10px] text-black/35 font-mono mt-1">
                          {s.reason} · {new Date(s.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs font-600 text-[#22C55E]">+${(s.amount || 0).toLocaleString()}</p>
                        <p className="text-[10px] px-1.5 py-0.5 mt-1 w-fit rounded-full bg-[#22C55E]/10 text-[#22C55E] font-mono">sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* service fee */}
            <div className="bg-white border border-black/5 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider flex items-center gap-2">
                  <Receipt size={13} /> Service fee
                </h3>
                <button
                  onClick={() => { setEditingFee(v => !v); setFeeError(""); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2F6BFF]/15 text-[11px] text-[#2F6BFF] font-mono hover:bg-[#2F6BFF]/25 transition-colors"
                >
                  {editingFee ? <X size={11} /> : <Plus size={11} />}
                  {editingFee ? "Cancel" : "Edit fee"}
                </button>
              </div>

              {/* current value */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-mono text-2xl font-700 text-[#0A0B0D]">
                  {typeof rec.serviceFee === "number"
                    ? `$${rec.serviceFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "Platform default"}
                </span>
                {typeof rec.serviceFee === "number" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF]">
                    custom
                  </span>
                )}
                {typeof rec.serviceFee !== "number" && (
                  <span className="text-[10px] font-mono text-black/30">(19.99% of transaction)</span>
                )}
              </div>

              {/* edit form */}
              {editingFee && (
                <div className="mb-5 p-4 rounded-xl bg-black/2 border border-black/6 space-y-3">
                  <p className="text-[10px] text-black/35 font-mono">
                    Set a flat dollar amount billed to this client instead of the platform default.
                    The previous value and your reason are written to the audit trail.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[9px] text-black/30 mb-1 font-mono">NEW FEE (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-black/40 font-mono">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={feeValue}
                          onChange={e => setFeeValue(e.target.value)}
                          placeholder="e.g. 872.00"
                          className="w-full bg-white border border-black/10 rounded-lg pl-6 pr-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] text-black/30 mb-1 font-mono">REASON (required)</label>
                      <input
                        value={feeReason}
                        onChange={e => setFeeReason(e.target.value)}
                        placeholder="e.g. Negotiated rate adjustment"
                        className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50"
                      />
                    </div>
                  </div>
                  {feeError && <p className="text-[11px] text-[#EF4444]">{feeError}</p>}
                  <button
                    onClick={() => void saveServiceFee()}
                    disabled={savingFee || !feeValue.trim() || !feeReason.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2F6BFF] text-white text-xs font-mono hover:bg-[#4F82FF] disabled:opacity-30 transition-colors"
                  >
                    <Save size={11} /> {savingFee ? "Saving…" : "Save fee"}
                  </button>
                </div>
              )}

              {/* fee change history */}
              {(rec.serviceFeeHistory ?? []).length > 0 && (
                <div className="border-t border-black/5 pt-3 space-y-1.5">
                  <p className="text-[10px] text-black/30 font-mono uppercase tracking-wider mb-2">Change history</p>
                  {(rec.serviceFeeHistory ?? []).slice(0, 8).map(h => (
                    <div key={h.id} className="flex items-start justify-between gap-3 text-[10px] font-mono">
                      <div className="text-black/45 leading-relaxed">
                        <span className="text-black/25">{h.from !== null ? `$${h.from.toFixed(2)}` : "default"}</span>
                        <span className="mx-1.5 text-black/20">→</span>
                        <span className="text-[#0A0B0D] font-600">${h.to.toFixed(2)}</span>
                        <span className="ml-2 text-black/30">· {h.reason}</span>
                      </div>
                      <span className="text-black/25 shrink-0">
                        {new Date(h.at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
                        images: c.images ?? [],

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
