import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Share2, Heart, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { mockNFTs } from '../data/mock';

const priceHistory = [
  { date: 'Mar', price: 1.2 }, { date: 'Apr', price: 1.8 }, { date: 'May', price: 1.4 },
  { date: 'Jun', price: 2.9 }, { date: 'Jul', price: 3.5 }, { date: 'Aug', price: 3.1 },
  { date: 'Sep', price: 4.2 },
];

export default function NFTDetail() {
  const { id } = useParams();
  const nft = mockNFTs.find(n => n.id === id) || mockNFTs[0];

  return (
    <div className="min-h-screen bg-[#0A0B0D] pt-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
        <Link to="/nfts" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={15} /> Back to NFTs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Artwork */}
          <div>
            <div className="rounded-3xl overflow-hidden border border-white/8 aspect-square bg-[#111318]">
              <img
                src={`https://images.unsplash.com/${nft.image}?w=800&h=800&fit=crop&auto=format`}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button className="flex-1 flex items-center justify-center gap-2 btn-ghost py-3 rounded-xl text-sm">
                <Heart size={15} /> Save
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 btn-ghost py-3 rounded-xl text-sm">
                <Share2 size={15} /> Share
              </button>
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-white/30">{nft.collection}</span>
              {nft.verified && (
                <div className="flex items-center gap-1 text-[#2F6BFF]">
                  <BadgeCheck size={13} />
                  <span className="text-xs">Verified</span>
                </div>
              )}
            </div>

            <h1 className="font-display font-800 text-4xl text-white mb-2">{nft.name}</h1>
            <span className="inline-block text-xs px-3 py-1.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] mb-6">{nft.rarity}</span>

            {/* Price */}
            <div className="glass rounded-2xl border border-white/8 p-6 mb-6">
              <p className="text-xs text-white/30 mb-2 font-mono">CURRENT PRICE</p>
              <div className="flex items-end gap-4 mb-4">
                <span className="font-mono font-800 text-4xl text-white">{nft.price} ETH</span>
                <span className="font-mono text-lg text-white/40 pb-1">${nft.usd.toLocaleString()}</span>
              </div>
              <div className={`flex items-center gap-2 mb-6 ${nft.change >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                <TrendingUp size={14} />
                <span className="font-mono text-sm">{nft.change >= 0 ? '+' : ''}{nft.change}% past 30 days</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/signup" className="btn-primary py-3.5 rounded-xl text-sm text-center">Buy now</Link>
                <button className="btn-ghost py-3.5 rounded-xl text-sm">Make offer</button>
              </div>
            </div>

            {/* Traits */}
            <div className="mb-6">
              <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-3">Traits</p>
              <div className="grid grid-cols-2 gap-2">
                {nft.traits.map(trait => (
                  <div key={trait.trait} className="rounded-xl border border-white/8 bg-white/3 p-3 text-center">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">{trait.trait}</p>
                    <p className="text-sm font-medium text-white mt-1">{trait.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price history */}
            <div>
              <p className="font-mono text-[10px] text-white/30 uppercase tracking-wider mb-4">Price History (ETH)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={priceHistory}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#F7F7F5' }} />
                  <Line type="monotone" dataKey="price" stroke="#8B5CF6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#8B5CF6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
