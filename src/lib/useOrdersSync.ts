import { useEffect, useState } from "react";

// Re-reads a local store whenever orders or auth change, so the dashboard
// portfolio, the admin notice feed, and any badge stay in sync.
export function useOrdersSync<T>(read: () => T): [T, () => void] {
  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const sync = () => setValue(read());
    window.addEventListener("indy-orders", sync);
    window.addEventListener("indy-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("indy-orders", sync);
      window.removeEventListener("indy-auth", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, () => setValue(read())];
}
