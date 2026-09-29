import { useEffect, useState } from "react";

// Re-reads a local store whenever orders, auth, records, or scans change, so
// every surface (dashboard, admin, badges) stays in sync without a backend.
// Includes "indy-record" (admin balance/KYC/card edits) so surfaces showing
// the client's record (balance maths) refresh when an admin edit lands.
export function useOrdersSync<T>(read: () => T): [T, () => void] {
  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const sync = () => setValue(read());
    window.addEventListener("indy-orders", sync);
    window.addEventListener("indy-wallet", sync);
    window.addEventListener("indy-chat", sync);
    window.addEventListener("indy-auth", sync);
    window.addEventListener("indy-scans", sync);
    window.addEventListener("indy-tickets", sync);
    window.addEventListener("indy-record", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("indy-orders", sync);
      window.removeEventListener("indy-wallet", sync);
      window.removeEventListener("indy-chat", sync);
      window.removeEventListener("indy-auth", sync);
      window.removeEventListener("indy-scans", sync);
      window.removeEventListener("indy-tickets", sync);
      window.removeEventListener("indy-record", sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [value, () => setValue(read())];
}

