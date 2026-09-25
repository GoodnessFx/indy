import { useEffect, useState } from "react";
import { Lock, X, Landmark } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { confirmOrderPaid, myOrders, placeOrder, type OrderKind } from "../lib/orders";
import { feeBreakdown, money, FEE_SCHEDULE_TABLE } from "../lib/fees";

export interface InvestTarget {
  assetId: string;
  assetName: string;
  kind: OrderKind;
  price: number;
  currency?: string;
}

// Signed-in invest flow. Submit creates a pending holding in the client
// portfolio and a notice in the admin feed. Confirming payment activates it.
export function useInvestFlow(target: InvestTarget, onDone?: () => void) {
  const { signedIn } = useAuth();
  const [amount, setAmount] = useState(String(Math.round(target.price)));
  const [phase, setPhase] = useState<"form" | "submitted" | "paid">("form");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const mine = myOrders().find(o => o.assetId === target.assetId && o.status === "pending");
    if (mine) {
      setOrderId(mine.id);
      setPhase("submitted");
    }
  }, [target.assetId]);

  const amt = parseFloat(amount) || 0;

  const submit = () => {
    if (!signedIn || amt <= 0) return;
    const order = placeOrder({
      assetId: target.assetId,
      assetName: target.assetName,
      kind: target.kind,
      amount: amt,
      currency: target.currency ?? "USD",
    });
    setOrderId(order.id);
    setPhase("submitted");
  };

  const pay = () => {
    if (!orderId) return;
    confirmOrderPaid(orderId);
    setPhase("paid");
    onDone?.();
  };

  return { amount, setAmount, amt, phase, submit, pay };
}

/** The itemised charge sheet shown before any transaction is confirmed. */
export function FeeBreakdownBlock({ amount, kind, currency = "USD" }: { amount: number; kind: OrderKind; currency?: string }) {
  const fees = feeBreakdown(amount, kind, currency);
  return (
    <div className="rounded-xl bg-black/3 border border-black/8 p-4 mb-4">
      <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider mb-3">Charges breakdown</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-black/50">Transaction amount</span>
          <span className="font-mono text-[#0A0B0D]">{money(fees.amount, currency)}</span>
        </div>
        {fees.lines.map(line => (
          <div key={line.key} className="flex justify-between gap-3">
            <span className="text-black/45">
              {line.label}
              <span className="block text-[10px] text-black/25">{line.detail}</span>
            </span>
            <span className="font-mono text-black/70 shrink-0">{money(line.amount, currency)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-black/8 pt-2">
          <span className="text-black/45">Fee subtotal</span>
          <span className="font-mono text-black/70">{money(fees.subtotal, currency)}</span>
        </div>
        {fees.tax > 0 && (
          <div className="flex justify-between">
            <span className="text-black/45">
              Tax (VAT / GST)
              <span className="block text-[10px] text-black/25">{(fees.taxRate * 100).toFixed(0)}% on the fee subtotal</span>
            </span>
            <span className="font-mono text-black/70">{money(fees.tax, currency)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-black/8 pt-2">
          <span className="font-medium text-[#0A0B0D]">Total charges</span>
          <span className="font-mono font-600 text-[#0A0B0D]">{money(fees.totalFees, currency)}</span>
        </div>
        <div className="flex justify-between items-center rounded-lg bg-[#2F6BFF]/8 px-3 py-2 border border-[#2F6BFF]/20">
          <span className="text-xs text-black/60">Total charged to you</span>
          <span className="font-mono font-700 text-[#0A0B0D]">{money(fees.totalCharged, currency)}</span>
        </div>
      </div>
    </div>
  );
}

export function FeeScheduleNote() {
  return (
    <details className="mb-4 rounded-xl border border-black/8 bg-black/2 p-3">
      <summary className="text-[11px] text-black/45 cursor-pointer font-mono">View the standard fee schedule</summary>
      <div className="mt-3 space-y-1.5">
        {FEE_SCHEDULE_TABLE.map(row => (
          <div key={row.label} className="flex justify-between gap-3 text-[11px]">
            <span className="text-black/50">{row.label}</span>
            <span className="text-black/35 text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

export function InvestShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-[81] flex sm:items-center sm:justify-center sm:p-6">
        <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-black/10 shadow-2xl max-h-[92vh] overflow-y-auto slide-up">
          <div className="sticky top-0 bg-white border-b border-black/5 px-5 py-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display font-600 text-base text-[#0A0B0D] truncate">{title}</p>
              <p className="text-[11px] text-black/35 font-mono mt-0.5 truncate">{subtitle}</p>
            </div>
            <button onClick={onClose} className="text-black/40 hover:text-black/70 shrink-0" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </>
  );
}

export function InvestSignInGate() {
  return (
    <div className="text-center py-4">
      <div className="w-11 h-11 rounded-xl bg-[#2F6BFF]/12 flex items-center justify-center mx-auto mb-3">
        <Lock size={20} className="text-[#2F6BFF]" />
      </div>
      <p className="text-sm font-semibold text-[#0A0B0D] mb-1">Sign in to invest</p>
      <p className="text-xs text-black/40 leading-relaxed mb-4">
        Your order is tied to your account and shows in your portfolio the moment you submit it.
      </p>
      <Link to="/login" className="btn-primary w-full py-3 rounded-xl text-sm block text-center">
        Sign in
      </Link>
    </div>
  );
}

export function InvestAwaitingPayment({ onPay, onLater }: { onPay: () => void; onLater: () => void }) {
  return (
    <>
      <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/8 p-4 mb-4 flex gap-3">
        <Landmark size={17} className="text-[#F59E0B] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#0A0B0D]">Order received, awaiting payment</p>
          <p className="text-xs text-black/45 leading-relaxed mt-1">
            The desk has been notified and your portfolio shows this as pending. Confirm payment
            below and the holding activates immediately.
          </p>
        </div>
      </div>
      <button onClick={onPay} className="btn-primary w-full py-3.5 rounded-xl text-sm">
        I have paid, activate my holding
      </button>
      <button onClick={onLater} className="w-full py-3 text-xs text-black/40 hover:text-black/70 mt-1">
        Pay later, keep it pending
      </button>
    </>
  );
}
