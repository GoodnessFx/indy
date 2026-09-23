import { useState } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

// Brand logo, sourced from indylogo.jpeg in the project root (mascot on white).
// Also used as the favicon. Falls back to a monogram if the file is missing.
export default function Logo({ size = 36, className = '' }: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <img
        src="/indylogo.jpeg"
        alt="Indy"
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className={`rounded-lg object-cover object-left ${className}`}
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

