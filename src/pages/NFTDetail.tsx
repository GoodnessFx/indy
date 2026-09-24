import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Share2, Heart, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { allNFTs } from '../data/catalog';
import AssetImage from '../components/AssetImage';

const priceHistory = [
  { date: 'Mar', price: 1.2 }, { date: 'Apr', price: 1.8 }, { date: 'May', price: 1.4 },
  { date: 'Jun', price: 2.9 }, { date: 'Jul', price: 3.5 }, { date: 'Aug', price: 3.1 },
  { date: 'Sep', price: 4.2 },
];

export default function NFTDetail() {
  const { id } = useParams();
  const nft = allNFTs.find(n => n.id === id) || allNFTs[0];

  return (
    <div className="min-h-screen bg-[#F7F7F5] pt-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10">
        <Link to="/nfts" className="inline-flex items-center gap-2 text-sm text-black/40 hover:text-black mb-8 transition-colors">
          <ArrowLeft size={15} /> Back to NFTs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Artwork */}
          <div>
            <div className="rounded-3xl overflow-hidden border border-black/8 aspect-square bg-white relative">
              <AssetImage seed={nft.image} label={nft.name} verified={nft.verified} className="absolute inset-0 w-full h-full" />
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
              <span className="text-xs text-black/30">{nft.collection}</span>
              {nft.verified && (
                <div className="flex items-center gap-1 text-[#2F6BFF]">
                  <BadgeCheck size={13} />
                  <span className="text-xs">Verified</span>
                </div>
              )}
            </div>

            <h1 className="font-display font-800 text-4xl text-[#0A0B0D] mb-2">{nft.name}</h1>
            <span className="inline-block text-xs px-3 py-1.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] mb-6">{nft.rarity}</span>

            {/* Price */}
            <div className="glass rounded-2xl border border-black/8 p-6 mb-6">
              <p className="text-xs text-black/30 mb-2 font-mono">CURRENT PRICE</p>
              <div className="flex items-end gap-4 mb-4">
                <span className="font-mono font-800 text-4xl text-[#0A0B0D]">{nft.price} ETH</span>
                <span className="font-mono text-lg text-black/40 pb-1">${nft.usd.toLocaleString()}</span>
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
              <p className="font-mono text-[10px] text-black/30 uppercase tracking-wider mb-3">Traits</p>
              <div className="grid grid-cols-2 gap-2">
                {nft.traits.map(trait => (
                  <div key={trait.trait} className="rounded-xl border border-black/8 bg-black/3 p-3 text-center">
                    <p className="text-[10px] text-black/30 uppercase tracking-wider">{trait.trait}</p>
                    <p className="text-sm font-medium text-[#0A0B0D] mt-1">{trait.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price history */}
            <div>
              <p className="font-mono text-[10px] text-black/30 uppercase tracking-wider mb-4">Price History (ETH)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={priceHistory}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(0,0,0,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(0,0,0,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: '#F7F7F5' }} />
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
