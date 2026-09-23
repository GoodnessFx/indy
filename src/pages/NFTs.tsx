import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, BadgeCheck, TrendingUp, TrendingDown, X } from 'lucide-react';
import { mockNFTs } from '../data/mock';

const sortOptions = ['Trending', 'Price: High', 'Price: Low', 'Recently listed'];
const collections = ['All', 'Digital Bloom', 'Neon Genesis', 'CryptoArt', 'Abstract Futures', 'NatureCode', 'MechVerse'];
const priceRanges = ['Any', '< 1 ETH', '1–5 ETH', '5–10 ETH', '> 10 ETH'];
const rarities = ['Any', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];

export default function NFTs() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Trending');
  const [collection, setCollection] = useState('All');
  const [priceRange, setPriceRange] = useState('Any');
  const [rarity, setRarity] = useState('Any');
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = mockNFTs.filter(nft => {
    if (search && !nft.name.toLowerCase().includes(search.toLowerCase()) && !nft.collection.toLowerCase().includes(search.toLowerCase())) return false;
    if (collection !== 'All' && nft.collection !== collection) return false;
    return true;
  });

  const cardHeights = [280, 360, 300, 320, 400, 260];

  return (
    <div className="min-h-screen bg-[#0A0B0D] pt-20">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
          <div className="flex items-end justify-between flex-col md:flex-row gap-6">
            <div>
              <p className="font-mono text-xs text-[#8B5CF6] tracking-widest uppercase mb-3">Marketplace</p>
              <h1 className="font-display font-800 text-4xl lg:text-5xl text-white">NFT Gallery</h1>
              <p className="text-white/40 text-sm mt-3">Curated digital collectibles. Verified on-chain provenance.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-3 border border-white/8">
                <Search size={15} className="text-white/30" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search NFTs..."
                  className="bg-transparent text-sm text-white placeholder-white/25 outline-none w-48"
                />
              </div>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 btn-ghost px-4 py-3 rounded-xl text-sm"
              >
                <SlidersHorizontal size={15} />
                Filters
              </button>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-sm text-white outline-none cursor-pointer"
              >
                {sortOptions.map(s => <option key={s} value={s} className="bg-[#111318]">{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8">
        <div className="flex gap-8">
          {/* Filter sidebar */}
          <aside className={`${filterOpen ? 'block' : 'hidden'} lg:block w-56 shrink-0`}>
            <div className="sticky top-24 space-y-6">
              <div>
                <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-3">Collection</p>
                <div className="space-y-1">
                  {collections.map(c => (
                    <button
                      key={c}
                      onClick={() => setCollection(c)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        collection === c ? 'bg-[#8B5CF6]/15 text-[#8B5CF6]' : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-3">Price Range</p>
                <div className="space-y-1">
                  {priceRanges.map(p => (
                    <button key={p} onClick={() => setPriceRange(p)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        priceRange === p ? 'bg-[#8B5CF6]/15 text-[#8B5CF6]' : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-3">Rarity</p>
                <div className="space-y-1">
                  {rarities.map(r => (
                    <button key={r} onClick={() => setRarity(r)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        rarity === r ? 'bg-[#8B5CF6]/15 text-[#8B5CF6]' : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {(collection !== 'All' || priceRange !== 'Any' || rarity !== 'Any') && (
                <button
                  onClick={() => { setCollection('All'); setPriceRange('Any'); setRarity('Any'); }}
                  className="flex items-center gap-2 text-xs text-[#EF4444] hover:text-[#EF4444]/80"
                >
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>
          </aside>

          {/* Masonry grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <Search size={32} className="text-white/15 mx-auto mb-4" />
                <p className="text-white/40">No NFTs match your filters</p>
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 xl:columns-3 gap-4 space-y-4">
                {filtered.map((nft, i) => (
                  <Link
                    key={nft.id}
                    to={`/nfts/${nft.id}`}
                    className="block break-inside-avoid rounded-2xl overflow-hidden border border-white/8 bg-[#111318] group card-hover"
                    style={{ marginBottom: '1rem' }}
                  >
                    <div className="relative overflow-hidden" style={{ height: cardHeights[i % cardHeights.length] }}>
                      <img
                        src={`https://images.unsplash.com/${nft.image}?w=500&h=${cardHeights[i % cardHeights.length]}&fit=crop&auto=format`}
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111318] to-transparent opacity-60" />
                      {nft.verified && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#2F6BFF]/20 border border-[#2F6BFF]/30 rounded-full px-2.5 py-1">
                          <BadgeCheck size={11} className="text-[#2F6BFF]" />
                          <span className="text-[10px] text-[#2F6BFF] font-medium">Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-display font-600 text-white group-hover:text-[#8B5CF6] transition-colors">{nft.name}</p>
                          <p className="text-xs text-white/30 mt-0.5">{nft.collection}</p>
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] shrink-0">{nft.rarity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono font-600 text-sm text-white">{nft.price} ETH</p>
                          <p className="font-mono text-xs text-white/30">${nft.usd.toLocaleString()}</p>
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-mono font-600 ${nft.change >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {nft.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {nft.change >= 0 ? '+' : ''}{nft.change}%
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
