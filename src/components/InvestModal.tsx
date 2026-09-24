import { useEffect, useState } from "react";
import { Lock, X, Landmark } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { confirmOrderPaid, myOrders, placeOrder, type OrderKind } from "../lib/orders";

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
