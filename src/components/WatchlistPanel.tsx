import { useEffect, useState } from "react";
import { Star, Trash2, BellRing, CheckCheck } from "lucide-react";
import {
  getTriggers,
  getWatchlist,
  markTriggersRead,
  removeWatch,
  updateWatchTarget,
  type WatchedAsset,
} from "../lib/watchlist";

// Watchlist and price alerts panel: starred assets across every marketplace,
// editable target prices, and a notification list when a target is hit. Uses
// the shared watchlist store so the count in the navbar stays in sync with
// this panel, the dashboard widget, and the star buttons on detail pages.

export default function WatchlistPanel() {
  const [items, setItems] = useState<WatchedAsset[]>(() => getWatchlist());
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [triggers, setTriggers] = useState(() => getTriggers());

  useEffect(() => {
    const sync = () => {
      setItems(getWatchlist());
      setTriggers(getTriggers());
    };
    window.addEventListener("indy-watchlist", sync);
    window.addEventListener("indy-triggers", sync);
    return () => {
      window.removeEventListener("indy-watchlist", sync);
      window.removeEventListener("indy-triggers", sync);
    };
  }, []);

  const saveTarget = (id: string) => {
    const raw = parseFloat(targets[id] ?? "");
    if (!Number.isFinite(raw) || raw <= 0) return;
    setItems(updateWatchTarget(id, raw));
    setTargets(t => ({ ...t, [id]: "" }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass rounded-2xl border border-black/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star size={15} className="text-[#F59E0B]" />
          <h3 className="font-display font-600 text-base text-[#0A0B0D]">Watchlist</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-black/40 font-mono">
            {items.length}
          </span>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-black/40 leading-relaxed">
            Nothing watched yet. Open any NFT, stock, or investment and use the star to
            follow it here.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="rounded-xl border border-black/8 bg-black/3 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0A0B0D] truncate">{item.name}</p>
                    <p className="text-[11px] text-black/30 font-mono capitalize">
                      {item.kind} target {item.currency} {item.target.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setItems(removeWatch(item.id))}
                    className="text-black/25 hover:text-[#EF4444] transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={targets[item.id] ?? ""}
                    onChange={e => setTargets(t => ({ ...t, [item.id]: e.target.value }))}
                    placeholder={`New target (${item.currency})`}
                    className="flex-1 bg-white border border-black/10 rounded-xl px-3 py-2 text-sm font-mono text-[#0A0B0D] outline-none focus:border-[#F59E0B]"
                  />
                  <button
                    onClick={() => saveTarget(item.id)}
                    className="px-4 py-2 rounded-xl bg-black/5 text-xs font-medium text-black/60 hover:bg-black/10 transition-colors"
                  >
                    Set
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl border border-black/8 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BellRing size={15} className="text-[#2F6BFF]" />
            <h3 className="font-display font-600 text-base text-[#0A0B0D]">Price alerts</h3>
          </div>
          {triggers.some(t => !t.read) && (
            <button
              onClick={() => { markTriggersRead(); setTriggers(getTriggers()); }}
              className="flex items-center gap-1.5 text-xs text-[#2F6BFF] hover:text-[#4F82FF]"
            >
              <CheckCheck size={13} /> Mark read
            </button>
          )}
        </div>
        {triggers.length === 0 ? (
          <p className="text-sm text-black/40 leading-relaxed">
            When a watched asset reaches its target, the alert lands here and in the
            notification bell.
          </p>
        ) : (
          <div className="space-y-2.5">
            {triggers.map(t => (
              <div
                key={t.id}
                className={`rounded-xl border p-3.5 ${
                  t.read ? "border-black/8" : "border-[#2F6BFF]/25 bg-[#2F6BFF]/5"
                }`}
              >
                <p className="text-sm font-medium text-[#0A0B0D]">{t.name}</p>
                <p className="text-xs text-black/45 mt-0.5 leading-relaxed">{t.message}</p>
                <p className="text-[10px] text-black/25 mt-1.5 font-mono">
                  {new Date(t.at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
