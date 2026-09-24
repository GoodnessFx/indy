import { useState } from "react";
import { ArrowUpRight, CalendarDays, CheckCheck, Newspaper } from "lucide-react";
import AssetImage from "./AssetImage";
import { getReadNews, markNewsRead } from "../lib/watchlist";

// Market briefing: short editorial reads tied to the assets on the platform.
// Static copy for now, wired to the Help Center audience, with read state
// persisted per account so returning readers see what they already opened.

export interface NewsItem {
  id: string;
  tag: string;
  title: string;
  body: string;
  date: string;
  readMins: number;
  photo: string;
  link: string;
}

export const NEWS: NewsItem[] = [
  {
    id: "news-nvda",
    tag: "Equities",
    title: "What the AI chip cycle means for a five stock starter sleeve",
    body: "Concentration is the story. A handful of semiconductor names now drive most index gains, so position sizing matters more than picking the next winner. This briefing walks through a starter layout the desk actually uses.",
    date: "Sep 22, 2026",
    readMins: 4,
    photo: "feat-stock",
    link: "/stocks/NVDA",
  },
  {
    id: "news-fleet",
    tag: "Vehicles",
    title: "Why fleet shares price differently from the car on the driveway",
    body: "Fleet income, utilisation, and resale timing set the return, not the sticker price. Here is how the desk underwrites a Model Y pool before it lists.",
    date: "Sep 18, 2026",
    readMins: 5,
    photo: "pillar-alt",
    link: "/vehicles",
  },
  {
    id: "news-nft",
    tag: "NFTs",
    title: "Provenance checks the desk runs before any artwork lists",
    body: "Contract age, creator history, wash trade screens, and a manual review. The full checklist, written for collectors rather than engineers.",
    date: "Sep 14, 2026",
    readMins: 3,
    photo: "feat-nft",
    link: "/nfts",
  },
  {
    id: "news-gold",
    tag: "Commodities",
    title: "Gold sleeves are back. How much ballast is enough",
    body: "Allocated bars behave nothing like paper gold when markets stress. A plain read on sizing a commodity sleeve inside a mixed portfolio.",
    date: "Sep 09, 2026",
    readMins: 4,
    photo: "feat-commodity",
    link: "/investments",
  },
];

export default function NewsFeed({ limit }: { limit?: number }) {
  const [read, setRead] = useState<string[]>(() => getReadNews());
  const items = limit ? NEWS.slice(0, limit) : NEWS;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(item => {
        const seen = read.includes(item.id);
        return (
          <a
            key={item.id}
            href={item.link}
            onClick={() => {
              markNewsRead(item.id);
              setRead(getReadNews());
            }}
            className="group rounded-2xl overflow-hidden border border-black/8 bg-white card-hover text-left"
          >
            <div className="relative h-36 overflow-hidden">
              <AssetImage
                seed={item.photo}
                label={item.title}
                showLabel={false}
                className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 photo-tint-bottom" />
              <span className="absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-full bg-black/45 text-white font-medium backdrop-blur-sm">
                {item.tag}
              </span>
              {seen && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-black/45 text-white/80 backdrop-blur-sm">
                  <CheckCheck size={10} /> Read
                </span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-display font-600 text-sm text-[#0A0B0D] leading-snug mb-2 group-hover:text-[#2F6BFF] transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-black/45 leading-relaxed mb-3 line-clamp-2">{item.body}</p>
              <div className="flex items-center justify-between text-[11px] text-black/30">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={11} /> {item.date} · {item.readMins} min
                </span>
                <ArrowUpRight size={13} className="group-hover:text-[#2F6BFF] transition-colors" />
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function NewsSectionHeading() {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Newspaper size={16} className="text-[#2F6BFF]" />
      <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase">Market briefing</p>
    </div>
  );
}
