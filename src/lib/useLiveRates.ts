import { useCallback, useEffect, useState } from "react";
import { FALLBACK_TO_USD, fetchLiveRates, type Rates } from "./rates";

const INITIAL: Rates = {
  toUSD: FALLBACK_TO_USD,
  offline: true,
  updated: new Date(),
};

export function useLiveRates(refreshMs = 30000) {
  const [rates, setRates] = useState<Rates>(INITIAL);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const next = await fetchLiveRates();
    setRates(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const next = await fetchLiveRates();
      if (!mounted) return;
      setRates(next);
      setLoading(false);
    };

    load();
    const timer = window.setInterval(load, refreshMs);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [refreshMs]);

  return { ...rates, loading, refresh };
}
