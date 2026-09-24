import { useState } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

// Brand logo, sourced from indylogo.jpeg in public (mascot on white).
// Also used as the favicon. Rendered on a light blue tile with a subtle ring so
// a white-backed mascot can never blend into the white navbar, and with
// object-contain so nothing is cropped. Falls back to a bold blue monogram
// only if the file itself is missing, so a logo mark is always visible.
export default function Logo({ size = 36, className = '' }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src="/indylogo.jpeg"
        alt="Indy Digital Marketing Solutions"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`rounded-lg object-contain bg-[#EAF0FF] ring-1 ring-[#2F6BFF]/25 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-lg bg-[#2F6BFF] flex items-center justify-center font-display font-800 text-white select-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-label="Indy Digital Marketing Solutions"
    >
      i
    </div>
  );
}

