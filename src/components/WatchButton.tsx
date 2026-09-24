import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { isWatched, pushTrigger, toggleWatch } from "../lib/watchlist";

// Star button shared by the NFT, stock, and investment detail pages. Toggles
// the asset in the shared watchlist store and raises a confirmation note in
// the alert feed so the new entry is visible immediately.

export default function WatchButton({
  id,
  kind,
  name,
  target,
  currency,
  className = "",
}: {
  id: string;
  kind: "nft" | "stock" | "investment";
  name: string;
  target: number;
  currency: string;
  className?: string;
}) {
  const [watched, setWatched] = useState(() => isWatched(id));

  useEffect(() => {
    const sync = () => setWatched(isWatched(id));
    window.addEventListener("indy-watchlist", sync);
    return () => window.removeEventListener("indy-watchlist", sync);
  }, [id]);

  const onClick = () => {
    const next = toggleWatch({ id, kind, name, target, currency });
    setWatched(next.some(w => w.id === id));
    if (next.some(w => w.id === id)) {
      pushTrigger({
        watchId: id,
        name,
        message: `Now on your watchlist with a ${currency} ${target.toLocaleString()} target.`,
      });
    }
  };

  return (
    <button
      onClick={onClick}
      aria-pressed={watched}
      title={watched ? "Remove from watchlist" : "Add to watchlist"}
      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-colors ${
        watched
          ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
          : "btn-ghost"
      } ${className}`}
    >
      <Star size={15} fill={watched ? "currentColor" : "none"} />
      {watched ? "Watching" : "Watch"}
    </button>
  );
}

export function WatchlistTeaser() {
  return (
    <p className="text-[11px] text-black/30 leading-relaxed">
      Star any asset to follow it. Targets and alerts live in{" "}
      <Link to="/dashboard" className="text-[#2F6BFF] hover:text-[#4F82FF]">
        your dashboard watchlist
      </Link>
      .
    </p>
  );
}
