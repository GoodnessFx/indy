import { useState } from "react";
import { Nfc, Eye, EyeOff, Landmark } from "lucide-react";

// Card face shown in Settings and in the admin console.
//
// TAP TO REVEAL: first tap un-blurs the details (holder, expiry, last 4),
// second tap blurs them out again — so a screen can be shown over the shoulder
// and cleared instantly.
//
// CARD DATA RULE: this component renders LAST4 ONLY. The "number" line is a
// masked display pattern (`•••• •••• •••• 8315`), never a stored primary
// account number. Nothing here can reveal a full PAN, and no PAN is ever
// written to storage, the API, or git.

export interface CardFace {
  brand: string;
  cardholder: string;
  expiry: string;
  last4: string;
  currency?: string;
  label?: string;
}

function brandColor(brand: string): { from: string; to: string } {
  const b = brand.toLowerCase();
  if (b.includes("chase")) return { from: "#0B62C7", to: "#063A78" };
  if (b.includes("visa")) return { from: "#1A4FCB", to: "#0A2E86" };
  if (b.includes("master")) return { from: "#EB4B24", to: "#8A1B0A" };
  if (b.includes("amex") || b.includes("american")) return { from: "#1E7BD6", to: "#0B3B6E" };
  if (b.includes("bank")) return { from: "#2F6BFF", to: "#14245E" };
  return { from: "#1F2937", to: "#0B1220" };
}

export function maskCard(last4: string): string {
  const four = (last4 || "").slice(-4).padStart(4, "0");
  return `•••• •••• •••• ${four}`;
}

export default function CardVisual({ card, compact = false }: { card: CardFace; compact?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const color = brandColor(card.brand || "");
  const masked = card.last4 ? maskCard(card.last4) : "•••• •••• •••• ••••";
  const hint = revealed ? "Details visible — tap to hide" : "Tap to show details";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={revealed}
      aria-label={hint}
      onClick={() => setRevealed(v => !v)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRevealed(v => !v);
        }
      }}
      className={`group relative w-full max-w-[420px] rounded-2xl overflow-hidden cursor-pointer select-none text-white shadow-lg ring-1 ring-white/10 transition-transform active:scale-[0.995] ${
        compact ? "p-4" : "p-6 sm:p-7"
      }`}
      style={{ background: `linear-gradient(135deg, ${color.from} 0%, ${color.to} 100%)` }}
    >
      {/* decorative sweeps */}
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-20 -bottom-24 h-56 w-56 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">
            {card.label || "Payment card"}
          </p>
          <p className="font-display font-700 text-lg leading-tight">
            {(card.brand || "Card").toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <Nfc size={20} />
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setRevealed(v => !v); }}
            aria-label={revealed ? "Hide card details" : "Show card details"}
            className="rounded-full p-1.5 bg-white/15 hover:bg-white/25 transition-colors"
          >
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* chip */}
      {!compact && (
        <div className="relative mt-6 mb-5 h-11 w-14 rounded-md bg-gradient-to-br from-[#E8D48B] to-[#B08C3E] ring-1 ring-black/20">
          <div className="absolute inset-1 rounded-sm border border-black/20" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black/20" />
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-black/20" />
        </div>
      )}

      {/* number: masked pattern + last4 only */}
      <p
        className={`relative font-mono tracking-[0.14em] ${
          compact ? "text-lg" : "text-lg sm:text-2xl"
        } ${revealed ? "" : "blur-[6px] sm:blur-[7px]"} transition-[filter] duration-300`}
        style={{ filter: revealed ? "none" : undefined }}
      >
        {masked}
      </p>

      <div className="relative mt-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-widest text-white/60">Cardholder</p>
          <p className={`truncate font-mono text-sm ${revealed ? "" : "blur-[5px]"} transition-[filter] duration-300`}>
            {card.cardholder || "—"}
          </p>
        </div>
        <div className="shrink-0">
          <p className="text-[9px] uppercase tracking-widest text-white/60">Expires</p>
          <p className={`font-mono text-sm ${revealed ? "" : "blur-[5px]"} transition-[filter] duration-300`}>
            {card.expiry || "—"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display font-700 text-xl italic tracking-tight">{(card.brand || "").toUpperCase()}</p>
          <p className="text-[9px] uppercase tracking-widest text-white/60">
            {card.currency || "USD"}
          </p>
        </div>
      </div>

      <p className="relative mt-4 flex items-center gap-1.5 text-[10px] text-white/60">
        <Landmark size={10} />
        Last 4 digits only — no full card number is stored anywhere
      </p>
    </div>
  );
}
