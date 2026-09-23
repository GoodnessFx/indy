import { useState } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

// Brand logo. Drop your logo file at `public/logo.png` and it appears here,
// in the nav, footer, auth screens, admin, and the favicon. Until then a clean
// monogram fallback renders so nothing ever looks broken.
export default function Logo({ size = 36, className = '' }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src="/logo.png"
        alt="Indy"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`rounded-lg object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-lg bg-[#2F6BFF] flex items-center justify-center font-display font-800 text-white select-none ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-label="Indy"
    >
      i
    </div>
  );
}
