// Wallet and NFT sync.
//
// The client connects the wallet they use on OpenSea, and this module pulls
// what that wallet holds and what it has been doing on chain, so the NFTs show
// up inside their Indy portfolio.
//
// Data sources, in order of preference:
//   1. OpenSea API v2, when VITE_OPENSEA_API_KEY is set (marketplace metadata).
//   2. Blockscout, public and keyless, so the feature works with no API key at
//      all. Ethereum mainnet.
//
// Neither needs a secret in the bundle: the OpenSea key is a public read-only
// key, and Blockscout has no key requirement.

import { getStoredGoogleUser } from "./googleAuth";

export interface WalletNft {
  id: string;
  name: string;
  collection: string;
  image: string | null;
  contract: string;
  tokenId: string;
  tokenType: string;
  chain: string;
  permalink?: string;
}

export interface WalletActivity {
  hash: string;
  at: string;
  direction: "in" | "out";
  counterparty: string;
  asset: string;
  amount: string;
  method: string;
}

export interface WalletSync {
  address: string;
  chain: string;
  source: "opensea" | "blockscout";
  nativeBalanceEth: number;
  nfts: WalletNft[];
  activity: WalletActivity[];
  syncedAt: string;
}

export interface ConnectedWallet {
  address: string;
  kind: "evm" | "solana";
  label: string;
}

const WALLET_KEY = "indy_connected_wallet";
const SYNC_KEY = "indy_wallet_sync";
const BLOCKSCOUT = "https://eth.blockscout.com/api/v2";
const OPENSEA_KEY = ((import.meta.env.VITE_OPENSEA_API_KEY as string | undefined) ?? "").trim();

function account(): string {
  const profile = getStoredGoogleUser();
  return profile?.email ?? profile?.sub ?? "guest";
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${key}_${account()}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(`${key}_${account()}`, JSON.stringify(value));
  } catch { /* storage unavailable */ }
}

function drop(key: string): void {
  try {
    localStorage.removeItem(`${key}_${account()}`);
  } catch { /* ignore */ }
}

export function saveConnectedWallet(wallet: ConnectedWallet | null): void {
  if (wallet) write(WALLET_KEY, wallet);
  else {
    // Never leave another wallet's assets in the portfolio.
    drop(WALLET_KEY);
    drop(SYNC_KEY);
  }
  window.dispatchEvent(new Event("indy-wallet-sync"));
}

export function getConnectedWallet(): ConnectedWallet | null {
  return read<ConnectedWallet | null>(WALLET_KEY, null);
}

export function getWalletSync(): WalletSync | null {
  return read<WalletSync | null>(SYNC_KEY, null);
}

export const openSeaKeyConfigured = OPENSEA_KEY.length > 10;

function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;
}

async function fetchOpenSea(address: string): Promise<WalletNft[] | null> {
  if (!openSeaKeyConfigured) return null;
  try {
    const res = await fetch(
      `https://api.opensea.io/api/v2/chain/ethereum/account/${address}/nfts?limit=50`,
      { headers: { "X-API-KEY": OPENSEA_KEY, accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      nfts?: {
        identifier: string;
        name: string | null;
        collection: string;
        contract: string;
        image_url?: string;
        display_image_url?: string;
        token_standard?: string;
      }[];
    };
    if (!json.nfts?.length) return null;
    return json.nfts.map(n => ({
      id: `${n.contract}-${n.identifier}`,
      name: n.name || `#${n.identifier}`,
      collection: n.collection,
      image: n.display_image_url ?? n.image_url ?? null,
      contract: n.contract,
      tokenId: n.identifier,
      tokenType: n.token_standard ?? "ERC-721",
      chain: "Ethereum",
      permalink: `https://opensea.io/assets/ethereum/${n.contract}/${n.identifier}`,
    }));
  } catch {
    return null;
  }
}

interface BlockscoutNftItem {
  id?: string | number;
  image_url?: string | null;
  token_type?: string;
  token?: { address_hash?: string; name?: string | null; symbol?: string | null; type?: string };
  metadata?: { name?: string | null; image?: string | null };
}

async function fetchBlockscoutNfts(address: string): Promise<WalletNft[]> {
  const res = await fetch(`${BLOCKSCOUT}/addresses/${address}/nft?type=ERC-721,ERC-1155`);
  if (!res.ok) throw new Error("Could not reach the chain explorer");
  const json = (await res.json()) as { items?: BlockscoutNftItem[] };
  return (json.items ?? []).map(item => {
    const contract = item.token?.address_hash ?? "";
    const tokenId = String(item.id ?? "");
    return {
      id: `${contract}-${tokenId}`,
      name: item.metadata?.name || item.token?.name || `Token #${tokenId}`,
      collection: item.token?.name || item.token?.symbol || "Unnamed collection",
      image: item.metadata?.image ?? item.image_url ?? null,
      contract,
      tokenId,
      tokenType: item.token_type ?? item.token?.type ?? "ERC-721",
      chain: "Ethereum",
      permalink: `https://opensea.io/assets/ethereum/${contract}/${tokenId}`,
    };
  });
}

interface BlockscoutTransfer {
  timestamp?: string;
  from?: { hash?: string };
  to?: { hash?: string };
  method?: string;
  token?: { symbol?: string | null; decimals?: string | null; name?: string | null };
  total?: { value?: string; decimals?: string | null };
  transaction_hash?: string;
}

async function fetchBlockscoutActivity(address: string): Promise<WalletActivity[]> {
  try {
    const res = await fetch(`${BLOCKSCOUT}/addresses/${address}/token-transfers`);
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: BlockscoutTransfer[] };
    const lower = address.toLowerCase();
    return (json.items ?? []).slice(0, 25).map(t => {
      const from = t.from?.hash ?? "";
      const to = t.to?.hash ?? "";
      const decimals = Number(t.total?.decimals ?? t.token?.decimals ?? 18);
      const raw = Number(t.total?.value ?? 0);
      const value = decimals > 0 ? raw / 10 ** decimals : raw;
      return {
        hash: t.transaction_hash ?? "",
        at: t.timestamp ?? new Date().toISOString(),
        direction: from.toLowerCase() === lower ? "out" as const : "in" as const,
        counterparty: shortAddr(from.toLowerCase() === lower ? to : from),
        asset: t.token?.symbol?.trim() || t.token?.name || "Token",
        amount: value.toLocaleString(undefined, { maximumFractionDigits: 6 }),
        method: t.method ?? "",
      };
    });
  } catch {
    return [];
  }
}

async function fetchNativeBalance(address: string): Promise<number> {
  try {
    const res = await fetch(`${BLOCKSCOUT}/addresses/${address}`);
    if (!res.ok) return 0;
    const json = (await res.json()) as { coin_balance?: string };
    return json.coin_balance ? Number(json.coin_balance) / 1e18 : 0;
  } catch {
    return 0;
  }
}

/**
 * Pull the connected wallet's NFTs and activity, then store them per account so
 * the portfolio shows the same holdings on the next visit without re-syncing.
 */
export async function syncWallet(): Promise<WalletSync> {
  const wallet = getConnectedWallet();
  if (!wallet) throw new Error("Connect a wallet first.");
  if (wallet.kind !== "evm") {
    throw new Error("NFT sync covers Ethereum wallets. Connect an EVM wallet such as MetaMask or Coinbase Wallet.");
  }

  const address = wallet.address;
  const [openSeaNfts, balance] = await Promise.all([
    fetchOpenSea(address),
    fetchNativeBalance(address),
  ]);

  let nfts: WalletNft[];
  let source: WalletSync["source"];
  if (openSeaNfts && openSeaNfts.length > 0) {
    nfts = openSeaNfts;
    source = "opensea";
  } else {
    nfts = await fetchBlockscoutNfts(address);
    source = "blockscout";
  }
  const activity = await fetchBlockscoutActivity(address);

  const result: WalletSync = {
    address,
    chain: "Ethereum",
    source,
    nativeBalanceEth: balance,
    nfts,
    activity,
    syncedAt: new Date().toISOString(),
  };
  write(SYNC_KEY, result);
  window.dispatchEvent(new Event("indy-wallet-sync"));
  return result;
}

export function walletAddressShort(): string {
  const w = getConnectedWallet();
  return w ? shortAddr(w.address) : "";
}

// --- Admin visibility: every wallet sync is reported to the console ---

export interface WalletPing {
  id: string;
  account: string;
  address: string;
  label: string;
  chain: string;
  source: string;
  nfts: { name: string; collection: string; image: string | null; tokenType: string; tokenId: string }[];
  activityCount: number;
  nativeBalanceEth: number;
  at: string;
}

const ADMIN_PING_KEY = "indy_admin_wallet_feed";

export function adminWalletPings(): WalletPing[] {
  try {
    const raw = localStorage.getItem(ADMIN_PING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WalletPing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Reports a completed sync so the admin console sees the wallet and its NFTs. */
export function recordWalletSync(sync: WalletSync): WalletPing {
  const wallet = getConnectedWallet();
  const profile = getStoredGoogleUser();
  const ping: WalletPing = {
    id: `wp-${Date.now().toString(36)}`,
    account: profile?.email ?? profile?.name ?? "Unknown client",
    address: sync.address,
    label: wallet?.label ?? "Wallet",
    chain: sync.chain,
    source: sync.source,
    nfts: sync.nfts.map(n => ({
      name: n.name,
      collection: n.collection,
      image: n.image,
      tokenType: n.tokenType,
      tokenId: n.tokenId,
    })),
    activityCount: sync.activity.length,
    nativeBalanceEth: sync.nativeBalanceEth,
    at: sync.syncedAt,
  };
  const next = [ping, ...adminWalletPings().filter(p => p.address !== ping.address)].slice(0, 60);
  try {
    localStorage.setItem(ADMIN_PING_KEY, JSON.stringify(next));
  } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event("indy-wallet-sync"));
  return ping;
}