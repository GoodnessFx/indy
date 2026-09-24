import { useState } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

// Brand logo. The real company mark is saved as indylogo.jpeg in public and is
// also the favicon. Rendered cleanly with object-contain so nothing is cropped,
// on a soft white backing with a faint ring so a white-backed mark never
// disappears into a white page. Falls back to a bold blue monogram only if the
// file is missing, so a logo mark is always visible.
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
        className={`rounded-md object-contain bg-white ring-1 ring-black/5 ${className}`}
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

