import { RefreshCw, ExternalLink } from 'lucide-react';
import type { ConnectedWallet, WalletSync } from '../lib/walletSync';
import { openSeaKeyConfigured } from '../lib/walletSync';

// Portfolio panel for the connected wallet: which wallet is linked, what it
// holds on chain, and the on chain activity trail.

export default function WalletPanel({
  wallet,
  walletSync,
  syncing,
  syncError,
  onSync,
}: {
  wallet: ConnectedWallet;
  walletSync: WalletSync | null;
  syncing: boolean;
  syncError: string;
  onSync: () => void;
}) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#0A0B0D] truncate">{wallet.label}</p>
          <p className="font-mono text-xs text-black/40 break-all">{wallet.address}</p>
          <p className="text-[11px] text-black/30 mt-1">
            {walletSync
              ? `${walletSync.nfts.length} NFT${walletSync.nfts.length === 1 ? '' : 's'} synced from ${walletSync.source === 'opensea' ? 'OpenSea' : 'the chain explorer'}, ${walletSync.nativeBalanceEth.toFixed(4)} ETH in the wallet`
              : 'Not synced yet'}
          </p>
        </div>
        <button
          onClick={onSync}
          disabled={syncing}
          className="btn-primary px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing' : 'Sync wallet'}
        </button>
      </div>

      {syncError && <p className="text-xs text-[#D97706] mb-3 leading-relaxed">{syncError}</p>}

      {walletSync && walletSync.nfts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
          {walletSync.nfts.map(nft => (
            <a
              key={nft.id}
              href={nft.permalink ?? '#'}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-xl overflow-hidden border border-black/8 bg-white hover:border-[#8B5CF6]/40 transition-colors group"
            >
              <div className="aspect-square bg-[#0d1020] overflow-hidden">
                {nft.image ? (
                  <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-white/50">
                    No image
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-[#0A0B0D] truncate">{nft.name}</p>
                <p className="text-[10px] text-black/35 truncate mt-0.5">{nft.collection}</p>
                <p className="text-[10px] text-[#8B5CF6] font-mono mt-1 flex items-center gap-1">
                  {nft.tokenType} #{nft.tokenId}
                  <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-xs text-black/35 leading-relaxed mb-4">
          {walletSync
            ? 'This wallet holds no NFTs on Ethereum right now. Anything you mint or buy appears here on the next sync.'
            : 'Run a sync to pull this wallet\'s NFTs and activity into your portfolio.'}
          {!openSeaKeyConfigured && ' Add VITE_OPENSEA_API_KEY for OpenSea collection metadata.'}
        </p>
      )}

      {walletSync && walletSync.activity.length > 0 && (
        <div className="rounded-xl border border-black/8 overflow-hidden">
          <div className="px-4 py-2.5 bg-black/3 border-b border-black/8">
            <p className="font-mono text-[10px] text-black/40 uppercase tracking-wider">On chain activity</p>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-black/5">
            {walletSync.activity.map(a => (
              <div key={`${a.hash}-${a.at}`} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.direction === 'in' ? 'bg-[#22C55E]' : 'bg-[#2F6BFF]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-black/70 truncate">
                    {a.direction === 'in' ? 'Received' : 'Sent'} {a.amount} {a.asset}
                    <span className="text-black/35"> {a.direction === 'in' ? 'from' : 'to'} {a.counterparty}</span>
                  </p>
                  <p className="text-[10px] text-black/25 font-mono truncate">{a.hash.slice(0, 18)}...</p>
                </div>
                <span className="text-[10px] text-black/25 font-mono shrink-0">
                  {new Date(a.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}