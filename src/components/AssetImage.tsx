import { useState } from "react";
import { fallbackIndex, resolvePhoto } from "../lib/images";

import { Image, BadgeCheck } from "lucide-react";

// Every image surface on the site renders through this component (or the
// photo-tint utilities for raw <img> tags like the hero). The photo itself
// always comes from the verified registry in lib/images, so a broken remote
// URL can never silently turn a section blank again: anything without a
// verified photo renders this deterministic branded placeholder tile, clearly
// labelled, never an unreviewed generated file.
//
// Tint rule: dark gradient tints only. White or light washes crush photo
// contrast and are not allowed here.

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

export default function AssetImage({
  seed,
  label = "Image coming soon",
  className = "w-full h-full",
  verified = false,
  showLabel = true,
  dark = false,
}: AssetImageProps) {
  const [failed, setFailed] = useState(false);
  const [from, to] = PALETTES[fallbackIndex(seed, PALETTES.length)];
  const src = resolvePhoto(seed);

  if (src && !failed) {
    return (
      <div className={`${className} relative overflow-hidden`} role="img" aria-label={label}>
        <img
          src={src}
          alt={label}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
        {verified && (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 backdrop-blur-sm">
            <BadgeCheck size={9} className="text-white/95" />
            <span className="text-[9px] font-medium text-white/95">Verified</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${className} relative flex items-center justify-center overflow-hidden`}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, #0A0B0D 55%, ${to} 100%)`,
      }}
      role="img"
      aria-label={label}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.18) 0%, transparent 58%)" }} />
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
