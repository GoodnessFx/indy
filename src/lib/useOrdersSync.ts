import { useEffect, useState } from "react";

// Re-reads a local store whenever orders, auth, or scans change, so every
// surface (dashboard, admin, badges) stays in sync without a backend.
export function useOrdersSync<T>(read: () => T): [T, () => void] {
  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const sync = () => setValue(read());
    window.addEventListener("indy-orders", sync);
    window.addEventListener("indy-auth", sync);
    window.addEventListener("indy-scans", sync);
    window.addEventListener("indy-tickets", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("indy-orders", sync);
      window.removeEventListener("indy-auth", sync);
      window.removeEventListener("indy-scans", sync);
      window.removeEventListener("indy-tickets", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, () => setValue(read())];
}

