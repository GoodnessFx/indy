import { useState, useEffect, useRef } from 'react';
import { Wallet, LogOut, ChevronDown, X } from 'lucide-react';

// One connect flow for two wallet families:
//, MetaMask and any EVM browser wallet, via window.ethereum (ethers.js)
//, Phantom on Solana, via window.solana injected provider
// This connects and displays the address only. Moving funds is not wired
// here, that belongs to the licensed payment processor boundary.

type WalletKind = 'evm' | 'solana';

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
  const [address, setAddress] = useState<string | null>(null);
  const [kind, setKind] = useState<WalletKind | null>(null);
  const [connecting, setConnecting] = useState<WalletKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Restore a previous connection on load if the wallet is still authorized.
  useEffect(() => {
    const restore = async () => {
      if (window.ethereum) {
        try {
          const accounts = (await window.ethereum.request({ method: 'eth_accounts' })) as string[];
          if (accounts?.length) {
            setAddress(accounts[0]);
            setKind('evm');
            return;
          }
        } catch { /* not connected yet */ }
      }
      if (window.solana?.isPhantom && window.solana.connect) {
        try {
          const res = await window.solana.connect({ onlyIfTrusted: true });
          if (res?.publicKey) {
            setAddress(res.publicKey.toString());
            setKind('solana');
          }
        } catch { /* not connected yet */ }
      }
    };
    restore();
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const connectEvm = async () => {
    setError(null);
    if (!window.ethereum) {
      setError('MetaMask is not installed. Add the MetaMask extension, then try again.');
      return;
    }
    try {
      setConnecting('evm');
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      if (accounts?.length) {
        setAddress(accounts[0]);
        setKind('evm');
        setOpen(false);
      }
    } catch {
      setError('The connection request was declined in the wallet.');
    } finally {
      setConnecting(null);
    }
  };

  const connectPhantom = async () => {
    setError(null);
    if (!window.solana?.isPhantom) {
      setError('Phantom is not installed. Install the Phantom extension or app, then try again.');
      return;
    }
    try {
      setConnecting('solana');
      const res = await window.solana.connect();
      if (res?.publicKey) {
        setAddress(res.publicKey.toString());
        setKind('solana');
        setOpen(false);
      }
    } catch {
      setError('The connection request was declined in Phantom.');
    } finally {
      setConnecting(null);
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

  const btnClass =
    variant === 'nav'
      ? 'btn-ghost px-4 py-2 rounded-lg text-sm flex items-center gap-2'
      : 'w-full py-3 rounded-xl border border-[#2F6BFF]/30 bg-[#2F6BFF]/8 text-[#2F6BFF] font-display font-600 text-sm flex items-center justify-center gap-2 hover:bg-[#2F6BFF]/15 transition-colors';
  if (address) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className={variant === "nav"
            ? "flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2F6BFF]/8 border border-[#2F6BFF]/20 text-sm font-mono text-[#2F6BFF] hover:bg-[#2F6BFF]/15 transition-colors"
            : btnClass}
        >
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span className="max-w-[130px] truncate">{shortenAddress(address)}</span>
          <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-black/8 shadow-xl shadow-black/10 p-2 z-50 slide-up">
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
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} disabled={connecting !== null} className={btnClass}>
        <Wallet size={15} />
        {connecting ? "Connecting..." : "Connect Wallet"}
      </button>

      {open && (
        <div className={`bg-white rounded-2xl border border-black/8 shadow-xl shadow-black/10 z-50 slide-up ${
          variant === "nav" ? "absolute right-0 mt-2 w-72 p-2" : "mt-3 p-2 w-full"
        }`}>
          {variant === "nav" && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-medium text-black/50">Choose a wallet</span>
              <button onClick={() => setOpen(false)} className="text-black/30 hover:text-black/60">
                <X size={14} />
              </button>
            </div>
          )}
          <button
            onClick={connectEvm}
            disabled={connecting !== null}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/5 text-left transition-colors disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-xl bg-[#F6851B]/10 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/metamask.svg" alt="MetaMask" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0A0B0D]">MetaMask</p>
              <p className="text-xs text-black/40">EVM chains, Ethereum and more</p>
            </div>
          </button>
          <button
            onClick={connectPhantom}
            disabled={connecting !== null}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/5 text-left transition-colors disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-xl bg-[#AB9FF2]/15 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/phantom.png" alt="Phantom" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0A0B0D]">Phantom</p>
              <p className="text-xs text-black/40">Solana wallets</p>
            </div>
          </button>
          {error && (
            <p className="px-3 py-2 text-xs text-[#D97706] leading-relaxed">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
