import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, LogOut, ChevronDown, X } from 'lucide-react';
import { useAuth } from '../lib/useAuth';

// One connect flow for two wallet families:
//  - EVM browser wallets (MetaMask, Coinbase, Trust, Rainbow, WalletConnect)
//    via window.ethereum (ethers.js).
//  - Phantom on Solana, via window.solana injected provider.
//
// Access is gated: the panel only opens on an explicit click, and signing in
// is required first. On small screens the menu renders as a proper bottom
// sheet instead of a desktop dropdown squeezed onto the phone.

type WalletKind = 'evm' | 'solana';

interface WalletOption {
  id: string;
  name: string;
  tag: string;
  img: string;
  bg: string;
  kind: WalletKind;
}

const WALLETS: WalletOption[] = [
  { id: 'metamask', name: 'MetaMask', tag: 'EVM chains', img: '/metamask.svg', bg: 'bg-[#F6851B]/10', kind: 'evm' },
  { id: 'coinbase', name: 'Coinbase Wallet', tag: 'EVM chains', img: '/coinbase.svg', bg: 'bg-[#0052FF]/10', kind: 'evm' },
  { id: 'phantom', name: 'Phantom', tag: 'Solana chains', img: '/phantom.png', bg: 'bg-[#AB9FF2]/15', kind: 'solana' },
  { id: 'trust', name: 'Trust Wallet', tag: 'Mobile wallet', img: '/trustwallet.svg', bg: 'bg-[#3375FF]/10', kind: 'evm' },
  { id: 'rainbow', name: 'Rainbow', tag: 'Mobile wallet', img: '/rainbow.svg', bg: 'bg-[#FF2E97]/10', kind: 'evm' },
  { id: 'walletconnect', name: 'WalletConnect', tag: 'Many mobile wallets', img: '/walletconnect.svg', bg: 'bg-[#3B99FC]/10', kind: 'evm' },
];

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
    solana?: {
      isPhantom?: boolean;
      connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
    };
  }
}

export function shortenAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ConnectWallet({ variant = 'nav' }: { variant?: 'nav' | 'deposit' }) {
  const { signedIn } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [kind, setKind] = useState<WalletKind | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside the desktop dropdown.
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // The wallet is only ever prompted on an explicit button click. Nothing here
  // opens the modal, starts a connection, or re-prompts on page load.

  const connectWith = async (w: WalletOption) => {
    setError(null);
    if (w.kind === 'solana') {
      if (!window.solana?.isPhantom) {
        setError(`${w.name} is not installed. Install the extension or app, then try again.`);
        return;
      }
      try {
        setConnectingId(w.id);
        const res = await window.solana.connect();
        if (res?.publicKey) {
          setAddress(res.publicKey.toString());
          setKind('solana');
          setOpen(false);
        }
      } catch {
        setError('The connection request was declined in the wallet.');
      } finally {
        setConnectingId(null);
      }
      return;
    }

    if (!window.ethereum) {
      setError(`${w.name} is not installed. Add the wallet extension, then try again.`);
      return;
    }
    try {
      setConnectingId(w.id);
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      if (accounts?.length) {
        setAddress(accounts[0]);
        setKind('evm');
        setOpen(false);
      }
    } catch {
      setError('The connection request was declined in the wallet.');
    } finally {
      setConnectingId(null);
    }
  };

  const disconnect = async () => {
    if (kind === 'solana' && window.solana) {
      try { await window.solana.disconnect(); } catch { /* already gone */ }
    }
    setAddress(null);
    setKind(null);
    setOpen(false);
    setCopied(false);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard?.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const btnLabel = connectingId ? 'Connecting...' : undefined;
  const connectingDisabled = connectingId !== null;

  // Account menu shown once a wallet is connected.
  const accountMenu = (
    <>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-black/50">
          {kind === "solana" ? "Phantom, Solana" : "EVM wallet"}
        </span>
        <button onClick={() => setOpen(false)} className="text-black/30 hover:text-black/60">
          <X size={14} />
        </button>
      </div>
      <button
        onClick={copyAddress}
        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-black/5 font-mono text-xs text-[#0A0B0D] break-all transition-colors"
      >
        {address}
        <span className="block text-[10px] text-[#2F6BFF] mt-0.5">{copied ? "Copied" : "Click to copy"}</span>
      </button>
      <button
        onClick={disconnect}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#DC2626] hover:bg-[#DC2626]/8 transition-colors"
      >
        <LogOut size={14} /> Disconnect
      </button>
    </>
  );
// Sign-in gate shown to signed-out users instead of the wallet list.
  const signInPrompt = (
    <div className={`${variant === "nav" ? "w-80 max-w-[calc(100vw-2rem)] p-3" : "p-3"} overflow-hidden`}>
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-black/50">Connect a wallet</span>
      </div>
      <div className="px-4 py-6 text-center">
        <div className="w-11 h-11 rounded-xl bg-[#2F6BFF]/12 flex items-center justify-center mx-auto mb-3">
          <Wallet size={20} className="text-[#2F6BFF]" />
        </div>
        <p className="text-sm font-semibold text-[#0A0B0D] mb-1 break-words">Sign in to connect a wallet</p>
        <p className="text-xs text-black/40 leading-relaxed mb-4 text-center break-words">
          You need an Indy Digital Marketing Solutions account before linking a wallet.
        </p>
        <Link to="/login" className="btn-primary w-full py-3 rounded-xl text-sm block text-center break-words">Sign in</Link>
      </div>
    </div>
  );

  // Wallet list shown to signed-in users.
  const walletList = (
    <>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-black/50">Choose a wallet</span>
        <button onClick={() => setOpen(false)} className="text-black/30 hover:text-black/60">
          <X size={14} />
        </button>
      </div>
      {WALLETS.map(w => (
        <button
          key={w.id}
          onClick={() => connectWith(w)}
          disabled={connectingId !== null}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/5 text-left transition-colors disabled:opacity-50"
        >
          <div className={`w-9 h-9 rounded-xl ${w.bg} flex items-center justify-center shrink-0 overflow-hidden`}>
            <img src={w.img} alt={w.name} className="w-6 h-6 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0A0B0D] truncate">
              {connectingId === w.id ? 'Connecting...' : w.name}
            </p>
            <p className="text-xs text-black/40">{w.tag}</p>
          </div>
        </button>
      ))}
      {error && <p className="px-3 py-2 text-xs text-[#D97706] leading-relaxed">{error}</p>}
    </>
  );

  const menuContent = address ? accountMenu : signedIn ? walletList : signInPrompt;
  const menuWidth = address ? 'w-72' : variant === 'nav' ? 'w-80' : 'w-full';

  // Desktop dropdown wrapper.
  const desktopMenu = (
    <div className={`hidden sm:block bg-white rounded-2xl border border-black/8 shadow-xl shadow-black/10 z-50 slide-up ${
      variant === "nav" ? `absolute right-0 mt-2 ${menuWidth}` : "mt-3 w-full"
    }`}>
      {menuContent}
    </div>
  );
// Mobile bottom-sheet wrapper.
  const mobileSheet = (
    <>
      <div className="fixed inset-0 bg-black/45 z-[70] sm:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-[71] sm:hidden bg-white rounded-t-2xl border-t border-black/10 shadow-2xl max-h-[85vh] overflow-y-auto slide-up">
        <div className="sticky top-0 bg-white border-b border-black/5 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#0A0B0D]">
            {address ? 'Wallet account' : 'Connect a wallet'}
          </span>
          <button onClick={() => setOpen(false)} className="text-black/40 hover:text-black/70"><X size={16} /></button>
        </div>
        <div className="p-2">{menuContent}</div>
      </div>
    </>
  );

  if (address) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          disabled={connectingDisabled}
          className={variant === "nav"
            ? "flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2F6BFF]/8 border border-[#2F6BFF]/20 text-sm font-mono text-[#2F6BFF] hover:bg-[#2F6BFF]/15 transition-colors"
            : "w-full py-3 rounded-xl border border-[#2F6BFF]/30 bg-[#2F6BFF]/8 text-[#2F6BFF] font-display font-600 text-sm flex items-center justify-center gap-2 hover:bg-[#2F6BFF]/15 transition-colors"}
        >
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span className="max-w-[130px] truncate">{btnLabel ?? shortenAddress(address)}</span>
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <>{desktopMenu}{mobileSheet}</>}
      </div>
    );
  }

  const btnClass =
    variant === 'nav'
      ? 'btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2'
      : 'w-full py-3 rounded-xl border border-[#2F6BFF]/30 bg-[#2F6BFF]/8 text-[#2F6BFF] font-display font-600 text-sm flex items-center justify-center gap-2 hover:bg-[#2F6BFF]/15 transition-colors';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} disabled={connectingDisabled} className={btnClass}>
        <Wallet size={15} />
        {btnLabel ?? 'Connect Wallet'}
      </button>
      {open && <>{desktopMenu}{mobileSheet}</>}
    </div>
  );
}