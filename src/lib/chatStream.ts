import { useEffect, useRef, useState } from "react";
import { API_BASE } from "./config";
import { isSupabaseConfigured, supabase } from "./supabase";

// Shared realtime chat transport — ShieldSafeBank-style.
//
// Transport order:
//   1. SSE /api/chat/stream (same-origin server.js — works on EVERY deploy,
//      every device, no extra setup, no SQL Editor).
//   2. Supabase Realtime when VITE_SUPABASE_URL/KEY are ALSO set (extra path
//      for static-only hosts).
// Both fan out instantly with no polling interval and no refresh.
//
// Usage:
//   const { connected, typingFrom } = useChatStream({ account, onMessage, onRead });
//
// - `account`: the client's account email. Omit/empty = admin mode (all threads).
// - Reconnect: EventSource retries automatically (server sends `retry: 3000`);
//   on error we also close + reopen with backoff, and re-sync via onReconnect.
// - Fallback: if the stream can't open (old browser, API down), a slow 15 s
//   safety poll keeps history converging until the stream recovers.

export interface ChatStreamEvent {
  type: "chat" | "read" | "typing" | "record" | "audit";
  account: string;
  message?: {
    id?: string;
    account?: string;
    name?: string;
    sender?: string;
    body?: string;
    at?: string;
    seen?: boolean;
  };
  role?: string;
}

interface UseChatStreamOptions {
  /** Client account email; empty string = admin (receives every thread). */
  account?: string;
  enabled?: boolean;
  onMessage?: (account: string) => void;
  onRead?: (account: string) => void;
  onTyping?: (account: string, role: string) => void;
  /** Called after a reconnect so the caller can re-pull full history. */
  onReconnect?: () => void;
}

export function useChatStream({
  account = "",
  enabled = true,
  onMessage,
  onRead,
  onTyping,
  onReconnect,
}: UseChatStreamOptions): { connected: boolean; typingFrom: string | null } {
  const [connected, setConnected] = useState(false);
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  const cbs = useRef({ onMessage, onRead, onTyping, onReconnect });
  cbs.current = { onMessage, onRead, onTyping, onReconnect };
  const accountRef = useRef(account);
  accountRef.current = account;
  const retryTimer = useRef<number | null>(null);
  const backoffRef = useRef(3000);
  const typingTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    // SSE first: same-origin server.js works on EVERY deploy, no extra setup.
    // Supabase Realtime attaches as well when configured (static-only hosts).
    let channel: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured && supabase) {
      const ch = supabase
        .channel(`support-chat-${account || "admin"}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_messages" },
          (payload) => {
            const row = (payload.new ?? {}) as { account?: string };
            const rowAccount = String(row.account ?? "");
            if (account && rowAccount && rowAccount !== account) return;
            setConnected(true);
            cbs.current.onMessage?.(rowAccount || account);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            cbs.current.onReconnect?.();
          }
        });
      channel = { unsubscribe: () => void supabase!.removeChannel(ch) };
    }
    if (typeof EventSource === "undefined") {
      return () => channel?.unsubscribe();
    }
    let source: EventSource | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      try {
        source?.close();
      } catch { /* ignore */ }
      const url =
        `${API_BASE}/chat/stream?account=${encodeURIComponent(accountRef.current)}&t=${Date.now()}`;
      try {
        source = new EventSource(url);
      } catch {
        scheduleRetry();
        return;
      }

      source.onopen = () => {
        setConnected(true);
        backoffRef.current = 3000;
        cbs.current.onReconnect?.();
      };

      source.addEventListener("chat", (e) => {
        try {
          const evt = JSON.parse((e as MessageEvent).data) as ChatStreamEvent;
          if (evt.type === "chat") cbs.current.onMessage?.(evt.account || accountRef.current);
          else if (evt.type === "read") cbs.current.onRead?.(evt.account || accountRef.current);
          else if (evt.type === "typing") {
            const role = String(evt.role || "agent");
            setTypingFrom(role);
            cbs.current.onTyping?.(evt.account || accountRef.current, role);
            if (typingTimer.current) window.clearTimeout(typingTimer.current);
            typingTimer.current = window.setTimeout(() => setTypingFrom(null), 4000);
          } else if (evt.type === "record" || evt.type === "audit") {
            // Admin changed this account's record (balance/cards/KYC). Let
            // the client re-fetch its record with no refresh.
            window.dispatchEvent(new Event("indy-record"));
          }
        } catch { /* malformed frame, ignore */ }
      });

      source.onerror = () => {
        setConnected(false);
        try {
          source?.close();
        } catch { /* ignore */ }
        scheduleRetry();
      };
    };

    const scheduleRetry = () => {
      if (closed) return;
      const delay = Math.min(backoffRef.current, 30000);
      backoffRef.current = Math.min(backoffRef.current * 2, 30000);
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
      retryTimer.current = window.setTimeout(connect, delay);
    };

    // Reconnect when the tab becomes visible again (mobile sleep / background).
    const onVisible = () => {
      if (document.visibilityState === "visible" && !closed) {
        if (!source || source.readyState === EventSource.CLOSED) connect();
        else cbs.current.onReconnect?.();
      }
    };

    connect();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", connect);
    return () => {
      closed = true;
      channel?.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", connect);
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      try {
        source?.close();
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, account]);

  return { connected, typingFrom };
}

/** Tell the other side "I'm typing" (fire-and-forget, throttled by caller). */
export function sendTyping(account: string, role: "client" | "agent"): void {
  if (!account) return;
  void fetch(`${API_BASE}/chat/typing`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ account, role }),
  }).catch(() => { /* stream will still deliver messages */ });
}

/** True when the shared Supabase DB is configured (extra realtime path). */
export function isSharedDbConfigured(): boolean {
  return isSupabaseConfigured;
}
