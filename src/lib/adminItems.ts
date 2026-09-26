// Admin-managed marketplace listings (NFTs), stored on the shared backend so a
// listing added in the admin console is visible to every client on every device.
//
// The catalog the client sees = built-in allNFTs + server items (modelled as
// NFTItem so the existing gallery + detail pages render them unchanged).

import { useEffect, useState } from "react";
import { API_BASE } from "./config";
import { isSupabaseConfigured, supabase } from "./supabase";
import { allNFTs, type NFTItem } from "../data/catalog";

export interface AdminItem extends Omit<NFTItem, "id"> {
  id: string;
  kind: "nft";
  createdAt: string;
  description?: string;
}

const CACHE_KEY = "indy_admin_items";
let cached: AdminItem[] | null = null;

function localItems(): AdminItem[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const v = raw ? (JSON.parse(raw) as AdminItem[]) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function cache(items: AdminItem[]): void {
  cached = items;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(items));
  } catch { /* storage unavailable */ }
}

function dbReady(): boolean {
  return isSupabaseConfigured && supabase !== null;
}

async function api(path: string, init?: RequestInit): Promise<any> {
  const url = path.startsWith("/api/") ? `${API_BASE}${path.slice(4)}` : path;
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`items API ${res.status}`);
  return res.json();
}

/** Fetch admin-added NFTs. Server first, then shared DB, then local mirror. */
export async function fetchAdminNFTs(force = false): Promise<AdminItem[]> {
  if (cached && !force) return cached;
  try {
    const rows = (await api(`/api/items?kind=nft&t=${Date.now()}`)) as AdminItem[];
    if (Array.isArray(rows)) {
      const mapped = rows.map((r) => ({ ...r, kind: "nft" as const }));
      cache(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  if (dbReady()) {
    try {
      const { data } = await supabase!
        .from("catalog_items")
        .select("data")
        .order("created_at", { ascending: false })
        .limit(200);
      const rows = (data ?? [])
        .map((d) => d.data as AdminItem)
        .filter((r) => r && r.kind === "nft");
      if (rows.length) {
        cache(rows);
        return rows;
      }
    } catch { /* ignore */ }
  }
  const local = localItems();
  if (local.length) {
    cache(local);
    return local;
  }
  return [];
}

/** Add or update a listing. Returns the saved item. */
export async function saveAdminNFT(
  input: Omit<AdminItem, "id" | "createdAt" | "kind">,
  existingId?: string
): Promise<AdminItem> {
  const id = existingId || `item-${Date.now().toString(36)}`;
  const payload: AdminItem = {
    ...input,
    id,
    kind: "nft",
    createdAt: new Date().toISOString(),
  };
  const merged = localItems().filter((i) => i.id !== id);
  cache([payload, ...merged]);
  try {
    await api("/api/items", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        audit: { action: "Add listing", admin: "admin", detail: { name: payload.name } },
      }),
    });
  } catch { /* shared DB fallback below */ }
  if (dbReady()) {
    try {
      await supabase!.from("catalog_items").upsert(
        { id, data: payload, created_at: new Date().toISOString() },
        { onConflict: "id" }
      );
    } catch { /* ignore */ }
  }
  window.dispatchEvent(new Event("indy-items"));
  return payload;
}

/** Remove a listing. */
export async function deleteAdminNFT(id: string): Promise<void> {
  cache(localItems().filter((i) => i.id !== id));
  try {
    await api(`/api/items?id=${encodeURIComponent(id)}&admin=admin`, { method: "DELETE" });
  } catch { /* fall through */ }
  if (dbReady()) {
    try {
      await supabase!.from("catalog_items").delete().eq("id", id);
    } catch { /* ignore */ }
  }
  window.dispatchEvent(new Event("indy-items"));
}

/** Full catalog a client sees: built-in NFTs + admin-added NFTs. */
export function useNFTCatalog(): { items: NFTItem[]; loading: boolean } {
  const [admin, setAdmin] = useState<AdminItem[]>(() => localItems());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = (force: boolean) => {
      void fetchAdminNFTs(force).then((rows) => {
        if (!active) return;
        setAdmin(rows);
        setLoading(false);
      });
    };
    load(false);
    const onItems = () => load(true);
    window.addEventListener("indy-items", onItems);
    return () => {
      active = false;
      window.removeEventListener("indy-items", onItems);
    };
  }, []);

  const items: NFTItem[] = [...admin, ...allNFTs];
  return { items, loading };
}
