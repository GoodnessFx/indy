import { useState } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

// Brand logo, sourced from indylogo.jpeg in public (mascot on white).
// Also used as the favicon. The file has a white background, so it renders
// on a white rounded tile with object-contain: the full mascot plus wordmark
// stays visible and never gets cropped. Falls back to a monogram only if the
// file itself is missing.
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
        className={`rounded-lg object-contain bg-white border border-black/10 ${className}`}
        style={{ width: size, height: size, padding: 2 }}
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

