import { useState } from "react";
import { useAuth } from "../lib/useAuth";
import {
  InvestAwaitingPayment,
  InvestShell,
  InvestSignInGate,
  useInvestFlow,
  type InvestTarget,
} from "../components/InvestModal";

// Thin wrapper so NFT detail keeps its layout while reusing the shared flow.
export default function NftInvestPanel({ target }: { target: InvestTarget }) {
  const { signedIn, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const flow = useInvestFlow(target);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary py-3.5 rounded-xl text-sm text-center w-full">
        Buy now
      </button>
      {open && (
        <InvestShell
          title={`Invest in ${target.assetName}`}
          subtitle={signedIn && profile ? `Signed in as ${profile.email}` : "Sign-in required"}
          onClose={() => setOpen(false)}
        >
          {!signedIn ? (
            <InvestSignInGate />
          ) : flow.phase === "form" ? (
            <>
              <label className="block text-xs text-black/40 mb-2">Amount ({target.currency ?? "USD"})</label>
              <input
                type="number"
                min="1"
                value={flow.amount}
                onChange={e => flow.setAmount(e.target.value)}
                className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#2F6BFF] mb-4"
              />
              <button onClick={flow.submit} disabled={flow.amt <= 0} className="btn-primary w-full py-3.5 rounded-xl text-sm disabled:opacity-50">
                Submit investment
              </button>
            </>
          ) : flow.phase === "submitted" ? (
            <InvestAwaitingPayment onPay={flow.pay} onLater={() => setOpen(false)} />
          ) : (
            <p className="text-sm text-[#22C55E] text-center py-4">Holding active. See it in your dashboard.</p>
          )}
        </InvestShell>
      )}
    </>
  );
}
