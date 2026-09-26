import { useEffect, useState } from "react";
import {
  ImagePlus, Trash2, Plus, RefreshCw, Check, Upload, X,
} from "lucide-react";
import AdminLayout from "./AdminLayout";
import { fetchAdminNFTs, saveAdminNFT, deleteAdminNFT, type AdminItem } from "../../lib/adminItems";

// Admin NFT-listing manager. Every piece is stored on the shared backend, so a
// listing added or removed here appears in the live marketplace for every
// device, with no redeploy.

const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

function fileToDataUrl(file: File, maxDim = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no canvas");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

const emptyForm = {
  name: "", collection: "", price: "", currency: "USD",
  rarity: "Rare", verified: true, description: "",
  t1t: "", t1v: "", t2t: "", t2v: "",
};

export default function AdminNFTs() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async (force = false) => {
    setItems(await fetchAdminNFTs(force));
    setLoading(false);
  };
  useEffect(() => {
    void load();
    const onItems = () => void load(true);
    window.addEventListener("indy-items", onItems);
    return () => window.removeEventListener("indy-items", onItems);
  }, []);

  const set = (k: keyof typeof emptyForm, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const flag = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(""), 3500); };

  const onImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      setErr("");
      setImage(await fileToDataUrl(file));
    } catch {
      setErr("That file could not be read. Try a JPG or PNG image.");
    }
  };

  const submit = async () => {
    setErr("");
    const price = Number(form.price);
    if (!image) { setErr("Upload an image first."); return; }
    if (!form.name.trim()) { setErr("Name is required."); return; }
    if (!Number.isFinite(price) || price <= 0) { setErr("Enter a valid price."); return; }
    setSaving(true);
    const traits: { trait: string; value: string }[] = [];
    if (form.t1t.trim()) traits.push({ trait: form.t1t.trim(), value: form.t1v.trim() || "—" });
    if (form.t2t.trim()) traits.push({ trait: form.t2t.trim(), value: form.t2v.trim() || "—" });
    try {
      await saveAdminNFT({
        name: form.name.trim(),
        collection: form.collection.trim() || "Admin Collection",
        price, currency: form.currency, usd: form.currency === "USD" ? price : Math.round(price * 1500),
        change: 0, image, verified: form.verified, rarity: form.rarity,
        description: form.description.trim(), traits,
      });
      setForm(emptyForm);
      setImage("");
      setLoading(false);
      await load(true);
      flag("Listing added — now visible in the marketplace.");
    } catch {
      setErr("Could not save the listing. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    setConfirmDelete(null);
    await deleteAdminNFT(id);
    await load(true);
    flag("Listing removed.");
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-mono font-700 text-xl text-[#0A0B0D]">NFT Listings</h1>
            <p className="text-xs text-black/35 mt-1">Add or remove marketplace listings. Changes appear for every client instantly.</p>
          </div>
          <button onClick={() => void load(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/8 text-[11px] text-black/40 hover:text-black/70 transition-colors font-mono">
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {msg && <p className="mb-4 flex items-center gap-1.5 text-xs text-[#22C55E] font-mono"><Check size={12} /> {msg}</p>}
        {err && <p className="mb-4 text-xs text-[#EF4444] font-mono">{err}</p>}

        {/* Add form */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 mb-8">
          <h3 className="flex items-center gap-2 font-mono text-xs text-black/50 uppercase tracking-wider mb-5">
            <Plus size={13} /> Add a listing
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* image upload */}
            <div>
              <label className="block text-[10px] text-black/40 mb-2 font-mono">IMAGE *</label>
              <label className="block aspect-square rounded-2xl border-2 border-dashed border-black/15 bg-black/2 hover:border-[#2F6BFF]/50 hover:bg-[#2F6BFF]/5 transition-colors cursor-pointer overflow-hidden">
                {image ? (
                  <img src={image} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center justify-center h-full text-black/30 gap-2">
                    <ImagePlus size={26} />
                    <span className="text-xs font-mono">Click to upload artwork</span>
                  </span>
                )}
                <input type="file" accept="image/*" className="sr-only" onChange={e => void onImage(e.target.files?.[0])} />
              </label>
              {image && (
                <button onClick={() => setImage("")} className="mt-2 flex items-center gap-1 text-[11px] text-black/40 hover:text-[#EF4444] font-mono">
                  <X size={11} /> Remove image
                </button>
              )}
            </div>

            {/* fields */}
            <div className="space-y-3">
              {[
                { k: "name" as const, label: "NAME", ph: "Untitled Original No. 8" },
                { k: "collection" as const, label: "COLLECTION", ph: "Indy Digital Originals" },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-[10px] text-black/40 mb-1 font-mono">{f.label}</label>
                  <input value={String(form[f.k])} placeholder={f.ph}
                    onChange={e => set(f.k, e.target.value)}
                    className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-black/40 mb-1 font-mono">PRICE *</label>
                  <input type="number" value={form.price} placeholder="150" min="0"
                    onChange={e => set("price", e.target.value)}
                    className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50" />
                </div>
                <div>
                  <label className="block text-[10px] text-black/40 mb-1 font-mono">CURRENCY</label>
                  <select value={form.currency} onChange={e => set("currency", e.target.value)}
                    className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none">
                    <option>USD</option>
                    <option>ETH</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-black/40 mb-1 font-mono">RARITY</label>
                  <select value={form.rarity} onChange={e => set("rarity", e.target.value)}
                    className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none">
                    {RARITIES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-black/50 cursor-pointer">
                    <input type="checkbox" checked={form.verified} onChange={e => set("verified", e.target.checked)}
                      className="accent-[#2F6BFF] w-4 h-4" />
                    Verified badge
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-black/40 mb-1 font-mono">DESCRIPTION</label>
                <textarea value={form.description} rows={2} onChange={e => set("description", e.target.value)}
                  className="w-full bg-black/3 border border-black/8 rounded-lg px-3 py-2 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([["t1t", "t1v"], ["t2t", "t2v"]] as const).map(([tk, vk], i) => (
                  <div key={tk}>
                    <label className="block text-[10px] text-black/40 mb-1 font-mono">TRAIT {i + 1}</label>
                    <div className="flex gap-1.5">
                      <input value={String(form[tk])} placeholder="Type" onChange={e => set(tk, e.target.value)}
                        className="w-1/2 bg-black/3 border border-black/8 rounded-lg px-2 py-2 text-[11px] text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50" />
                      <input value={String(form[vk])} placeholder="Value" onChange={e => set(vk, e.target.value)}
                        className="w-1/2 bg-black/3 border border-black/8 rounded-lg px-2 py-2 text-[11px] text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/50" />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => void submit()} disabled={saving}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2F6BFF] text-white text-xs font-mono hover:bg-[#4F82FF] disabled:opacity-50 transition-colors">
                {saving ? <><RefreshCw size={12} className="animate-spin" /> Saving…</> : <><Upload size={12} /> Publish listing</>}
              </button>
            </div>
          </div>
        </div>

        {/* Existing admin listings */}
        <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between gap-3">
            <h3 className="font-mono text-xs text-black/50 uppercase tracking-wider">Admin listings ({items.length})</h3>
            <span className="text-[10px] text-black/25 font-mono">Shared store — visible to all clients</span>
          </div>
          {loading ? (
            <p className="px-6 py-10 text-xs text-black/30 text-center font-mono">Loading listings…</p>
          ) : items.length === 0 ? (
            <p className="px-6 py-10 text-xs text-black/30 text-center font-mono">No admin listings yet. Add one above to see it in the live marketplace.</p>
          ) : (
            <div className="divide-y divide-black/5">
              {items.map(it => (
                <div key={it.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-black/5">
                    {it.image && (it.image.startsWith("data:") || it.image.startsWith("http"))
                      ? <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-[8px] text-black/25 font-mono">No img</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-black/80 truncate font-mono">{it.name}</p>
                    <p className="text-[10px] text-black/35 truncate">{it.collection} · {it.rarity}</p>
                  </div>
                  <span className="text-xs font-mono text-black/60 shrink-0">{it.price} {it.currency}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${it.verified ? "bg-[#2F6BFF]/10 text-[#2F6BFF]" : "bg-black/5 text-black/40"} font-mono`}>
                    {it.verified ? "Verified" : "Unverified"}
                  </span>
                  <button onClick={() => void remove(it.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono transition-colors ${
                      confirmDelete === it.id
                        ? "bg-[#EF4444] text-white hover:bg-[#DC2626]"
                        : "text-[#EF4444]/60 hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                    }`}>
                    <Trash2 size={11} />
                    {confirmDelete === it.id ? "Confirm delete" : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
