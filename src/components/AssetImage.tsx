import { Image, BadgeCheck } from "lucide-react";

// Deterministic, safe placeholder used in place of any unvetted AI-generated
// artwork. Renders a clean branded gradient tile with an icon and a clearly
// labelled "Coming soon" note, never an AI image that has not been reviewed.
//
// Swap in real, licensed asset photography before launch. This exists so a
// generated image can never ship unintentionally, which is what happened on
// the homepage NFT preview.
//
// The tile is deterministic from `seed`, so the same asset always gets the
// same palette on every render and every reload.

interface AssetImageProps {
  /** Stable id used to derive a consistent palette. Use the asset id. */
  seed: string;
  /** Accessible description, used as the aria-label. */
  label?: string;
  /** Extra Tailwind classes. Defaults to filling a sized parent. */
  className?: string;
  /** Render a small "Verified" chip (used on NFT cards). */
  verified?: boolean;
  /** Hide the "Coming soon" caption (used on tiny thumbnails). */
  showLabel?: boolean;
  /** Tint the accent for use on darker surfaces. */
  dark?: boolean;
}

const PALETTES: [from: string, to: string, accent: string][] = [
  ["#2F6BFF", "#0B1020", "#7DA6FF"],
  ["#1E3A8A", "#0A0B0D", "#A5C4FF"],
  ["#166534", "#0B1E14", "#5BD07B"],
  ["#7C3AED", "#100B20", "#B18CFF"],
  ["#0EA5E9", "#0A1724", "#7CC9FF"],
  ["#B45309", "#1A1207", "#F5B95B"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) & 0x7fffffff;
  }
  return Math.abs(h);
}

export default function AssetImage({
  seed,
  label = "Image coming soon",
  className = "w-full h-full",
  verified = false,
  showLabel = true,
  dark = false,
}: AssetImageProps) {
  const [from, to] = PALETTES[hash(seed) % PALETTES.length];
  return (
    <div
      className={`${className} flex items-center justify-center overflow-hidden`}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, #0A0B0D 55%, ${to} 100%)`,
      }}
      role="img"
      aria-label={label}
    >
      <div
        className="pointer-events-none"
        style={{ background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.18) 0%, transparent 58%)" }}
      />
      <div className="relative flex flex-col items-center justify-center gap-2">
        <Image size={22} strokeWidth={1.5} className="text-white/95" />
        {showLabel && (
          <span className="text-[9px] font-mono uppercase tracking-widest text-white/75 select-none">
            Coming soon
          </span>
        )}
      </div>
      {verified && (
        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
          <BadgeCheck size={9} className="text-white/90" />
          <span className="text-[9px] font-medium text-white/90">Verified</span>
        </span>
      )}
      {dark && <span className="sr-only">{label}</span>}
    </div>
  );
}