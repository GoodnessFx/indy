// Shared chat + user/login store. ShieldSafeBank-style: ONE backend
// (server.js serves frontend + /api in one process, Postgres via DATABASE_URL
// when set, file fallback locally) — no SQL Editor steps, no second service.
//
// Transport order per call:
//   1. Same-origin /api (server.js) — works on every deploy, every device.
//   2. Supabase shared DB when VITE_SUPABASE_URL/KEY are ALSO set (extra
//      realtime path on static-only hosts).
//   3. localStorage mirror (offline only).
//
// Realtime: Supabase Realtime when configured, else SSE /api/chat/stream.
// See src/lib/chatStream.ts.

import { getStoredGoogleUser } from "./googleAuth";
import { API_BASE } from "./config";
import { isSupabaseConfigured, supabase } from "./supabase";

export interface ChatMessage {
  id: string;
  account: string;
  name: string;
  from: "client" | "agent";
  text: string;
  at: string;
  /** True once the admin has seen this client message. */
  seen?: boolean;
}

export interface LoginEvent {
  account: string;
  name: string;
  method: string;
  at: string;
}

const LOCAL_KEY = "indy_chat_threads";

type Threads = Record<string, ChatMessage[]>;

function dbEnabled(): boolean {
  return isSupabaseConfigured && supabase !== null;
}

function readAll(): Threads {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Threads;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(threads: Threads): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(threads));
  } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event("indy-chat"));
}

export function currentAccount(): { account: string; name: string } {
  const profile = getStoredGoogleUser();
  const account = profile?.email ?? profile?.sub ?? "guest";
  const name = profile?.name || profile?.email || "Client";
  return { account, name };
}

// --- JSON API helpers (same-origin server.js /api) ---

async function apiRequest(path: string, init?: RequestInit): Promise<unknown> {
  const url = path.startsWith("/api/") ? `${API_BASE}${path.slice(4)}` : path;
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Chat API ${res.status}`);
  return res.json();
}

function toChatMessage(row: {
  id?: string;
  account?: string;
  name?: string;
  sender?: string;
  body?: string;
  at?: string;
  sent_at?: string;
  seen?: boolean;
}): ChatMessage {
  return {
    id: String(row.id ?? `m-${Date.now().toString(36)}`),
    account: String(row.account ?? ""),
    name: String(row.name ?? row.account ?? ""),
    from: row.sender === "agent" ? "agent" : "client",
    text: String(row.body ?? ""),
    at: String(row.sent_at ?? row.at ?? new Date().toISOString()),
    seen: row.seen ?? false,
  };
}

async function dbThread(account: string): Promise<ChatMessage[]> {
  if (!dbEnabled()) return [];
  try {
    const { data, error } = await supabase!
      .from("support_messages")
      .select("id,account,name,sender,body,sent_at,seen")
      .eq("account", account)
      .order("sent_at", { ascending: true })
      .limit(500);
    if (error || !Array.isArray(data)) return [];
    return (data as Parameters<typeof toChatMessage>[0][]).map(toChatMessage);
  } catch {
    return [];
  }
}

async function dbAll(): Promise<ChatMessage[]> {
  if (!dbEnabled()) return [];
  try {
    const { data, error } = await supabase!
      .from("support_messages")
      .select("id,account,name,sender,body,sent_at,seen")
      .order("sent_at", { ascending: true })
      .limit(1000);
    if (error || !Array.isArray(data)) return [];
    return (data as Parameters<typeof toChatMessage>[0][]).map(toChatMessage);
  } catch {
    return [];
  }
}

async function dbInsert(message: ChatMessage): Promise<boolean> {
  if (!dbEnabled()) return false;
  try {
    const { error } = await supabase!.from("support_messages").insert({
      id: message.id,
      account: message.account,
      name: message.name,
      sender: message.from,
      body: message.text,
      sent_at: message.at,
      seen: message.from === "agent" ? true : (message.seen ?? false),
    });
    return !error;
  } catch {
    return false;
  }
}

async function dbMarkSeen(account: string): Promise<boolean> {
  if (!dbEnabled()) return false;
  try {
    const { error } = await supabase!
      .from("support_messages")
      .update({ seen: true })
      .eq("account", account)
      .eq("sender", "client")
      .eq("seen", false);
    return !error;
  } catch {
    return false;
  }
}

async function pullThread(account: string): Promise<ChatMessage[]> {
  try {
    const rows = (await apiRequest(`/api/chat/thread?account=${encodeURIComponent(account)}&t=${Date.now()}`)) as unknown;
    if (!Array.isArray(rows)) return [];
    return (rows as Parameters<typeof toChatMessage>[0][]).map(toChatMessage);
  } catch {
    return [];
  }
}

/**
 * Fetch all conversations. Source order: /api (ONE backend, every device) ->
 * Supabase shared DB (if ALSO configured) -> local mirror. Used by the admin
 * inbox for true cross-device visibility.
 */
export async function fetchAllFromServer(): Promise<{ account: string; name: string; messages: ChatMessage[]; lastAt: string; unread: number }[]> {
  // 1. Same-origin API — the shared store on every deploy.
  try {
    const rows = (await apiRequest(`/api/chat/all?t=${Date.now()}`)) as unknown;
    if (Array.isArray(rows)) {
      const msgs = (rows as Parameters<typeof toChatMessage>[0][]).map(toChatMessage);
      const grouped = groupByAccount(msgs);
      for (const g of grouped) mergeServer(g.account, g.messages);
      if (grouped.length) return grouped;
    }
  } catch { /* API unreachable — try shared DB, then local */ }

  // 2. Shared Supabase DB (extra path for static-only hosts).
  const shared = await dbAll();
  if (shared.length) {
    for (const g of groupByAccount(shared)) mergeServer(g.account, g.messages);
    return groupByAccount(shared);
  }

  // 3. Local mirror (offline only).
  return conversations();
}

function groupByAccount(messages: ChatMessage[]): { account: string; name: string; messages: ChatMessage[]; lastAt: string; unread: number }[] {
  const byAccount = new Map<string, ChatMessage[]>();
  for (const m of messages) {
    if (!m.account) continue;
    const list = byAccount.get(m.account) ?? [];
    list.push(m);
    byAccount.set(m.account, list);
  }
  const result: { account: string; name: string; messages: ChatMessage[]; lastAt: string; unread: number }[] = [];
  for (const [account, list] of byAccount) {
    const sorted = list.sort((a, b) => (a.at < b.at ? -1 : 1));
    result.push({
      account,
      name: sorted.find(m => m.from === 'client')?.name || account,
      messages: sorted,
      lastAt: sorted[sorted.length - 1]?.at ?? '',
      unread: sorted.filter(m => m.from === 'client' && !m.seen).length,
    });
  }
  return result.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}
async function pushServer(payload: {
  id?: string;
  account: string;
  name: string;
  sender: "client" | "agent";
  body: string;
  at?: string;
}): Promise<boolean> {
  // Same-origin API first — the ONE shared store, no extra setup.
  try {
    await apiRequest("/api/chat/send", { method: "POST", body: JSON.stringify(payload) });
    return true;
  } catch { /* fall through to shared DB */ }
  if (dbEnabled()) {
    const ok = await dbInsert({
      id: String(payload.id ?? `m-${Date.now().toString(36)}`),
      account: payload.account,
      name: payload.name,
      from: payload.sender,
      text: payload.body,
      at: payload.at ?? new Date().toISOString(),
      seen: payload.sender === "agent",
    });
    if (ok) return true;
  }
  return false;
}

export function threadFor(account: string): ChatMessage[] {
  return readAll()[account] ?? [];
}

export function conversations(): { account: string; name: string; messages: ChatMessage[]; lastAt: string; unread: number }[] {
  const threads = readAll();
  return Object.entries(threads)
    .map(([account, messages]) => ({
      account,
      name: messages.find(m => m.from === "client")?.name || account,
      messages,
      lastAt: messages[messages.length - 1]?.at ?? "",
      unread: messages.filter(m => m.from === "client" && !m.seen).length,
    }))
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

export function totalUnreadForAdmin(): number {
  return conversations().reduce((sum, c) => sum + c.unread, 0);
}

function append(account: string, message: ChatMessage): void {
  const threads = readAll();
  threads[account] = [...(threads[account] ?? []), message];
  writeAll(threads);
}

export function sendClient(text: string): ChatMessage {
  const { account, name } = currentAccount();
  const message: ChatMessage = {
    id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    account,
    name,
    from: "client",
    text,
    at: new Date().toISOString(),
  };
  append(account, message);
  void pushServer({
    id: message.id,
    account,
    name,
    sender: "client",
    body: text,
    at: message.at,
  });
  return message;
}

export function sendAgent(account: string, text: string): ChatMessage {
  const message: ChatMessage = {
    id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    account,
    name: "Indy Support",
    from: "agent",
    text,
    at: new Date().toISOString(),
  };
  append(account, message);
  void pushServer({
    id: message.id,
    account,
    name: "Indy Support",
    sender: "agent",
    body: text,
    at: message.at,
  });
  return message;
}

/** Marks every client message as seen by the admin console. */
export function markThreadSeen(account: string): void {
  const threads = readAll();
  if (!threads[account]) return;
  threads[account] = threads[account].map(m => (m.from === "client" ? { ...m, seen: true } : m));
  writeAll(threads);
}

// --- Server sync (local API), automatic when the API is up ---

/** Merge a server thread into the local mirror. */
function mergeServer(account: string, messages: ChatMessage[]): boolean {
  const threads = readAll();
  const list = threads[account] ?? [];
  let changed = false;
  for (const m of messages) {
    const known = list.find(x => x.id === m.id);
    if (known) {
      if (m.from === "client" && !known.seen && m.seen) {
        known.seen = true;
        changed = true;
      }
      continue;
    }
    list.push(m);
    changed = true;
  }
  if (changed) {
    threads[account] = list.sort((a, b) => (a.at < b.at ? -1 : 1));
    writeAll(threads);
  }
  return changed;
}

/**
 * Pull one thread from the shared store, merge locally, and return it.
 * Source order: /api -> Supabase -> local. Authoritative read path
 * for the client widget.
 */
export async function refreshThread(account: string): Promise<ChatMessage[]> {
  const server = await pullThread(account);
  if (server.length) {
    for (const m of server) mergeServer(account, [m]);
    return server.sort((a, b) => (a.at < b.at ? -1 : 1));
  }
  const shared = await dbThread(account);
  if (shared.length) {
    for (const m of shared) mergeServer(account, [m]);
    return shared.sort((a, b) => (a.at < b.at ? -1 : 1));
  }
  return threadFor(account);
}

/**
 * Notify the admin that a client just logged in. Called once per session from
 * the auth hook. Silently no-ops if the API is unavailable.
 */
export async function notifyLogin(account: string, name: string): Promise<void> {
  try {
    await apiRequest('/api/chat/login', {
      method: 'POST',
      body: JSON.stringify({ account, name }),
    });
  } catch { /* API optional */ }
}

/**
 * Pull every thread (admin side), mark threads you open as seen on the
 * server so the badge clears everywhere, and mirror the results locally.
 */
export async function refreshChat(): Promise<void> {
  try {
    const rows = (await apiRequest("/api/chat/all")) as unknown;
    if (!Array.isArray(rows)) return;
    const byAccount = new Map<string, ChatMessage[]>();
    for (const m of (rows as Parameters<typeof toChatMessage>[0][]).map(toChatMessage)) {
      const list = byAccount.get(m.account) ?? [];
      list.push(m);
      byAccount.set(m.account, list);
    }
    for (const [account, messages] of byAccount) mergeServer(account, messages);
  } catch { /* API optional, local mirror already works */ }
}

export async function markThreadSeenRemote(account: string): Promise<void> {
  try {
    await apiRequest(`/api/chat/seen?account=${encodeURIComponent(account)}`, { method: "POST" });
    return;
  } catch { /* fall through to shared DB */ }
  await dbMarkSeen(account);
}

// --- Shared signup + login history: /api first (ONE backend), Supabase extra ---

const LOGIN_LOCAL_KEY = "indy_login_history";

function readLoginLocal(): LoginEvent[] {
  try {
    const raw = localStorage.getItem(LOGIN_LOCAL_KEY);
    const v = raw ? (JSON.parse(raw) as LoginEvent[]) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Record a signup + every successful login: /api first, mirror locally. */
export async function recordSharedLogin(account: string, name: string, method: string): Promise<void> {
  const entry: LoginEvent = { account, name, method, at: new Date().toISOString() };
  try {
    const next = [entry, ...readLoginLocal()].slice(0, 200);
    localStorage.setItem(LOGIN_LOCAL_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  window.dispatchEvent(new Event("indy-logins"));
  try {
    await apiRequest("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email: account, name, method }),
    });
    return;
  } catch { /* fall through to shared DB */ }
  if (!dbEnabled()) return;
  try {
    await supabase!.from("indy_users").upsert(
      { email: account, name, last_login_at: entry.at },
      { onConflict: "email" }
    );
    await supabase!.from("indy_login_events").insert({
      id: `lg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      email: account,
      name,
      method,
      at: entry.at,
    });
  } catch { /* shared DB unreachable — local mirror kept */ }
}

/** Every known user + full login history, for the admin Users view. */
export async function fetchSharedUsers(): Promise<{ email: string; name: string; createdAt: string; lastLoginAt: string; loginCount: number; logins: LoginEvent[] }[]> {
  // 1. Same-origin API — the shared store on every deploy.
  try {
    const rows = (await apiRequest(`/api/users/all?t=${Date.now()}`)) as unknown;
    if (Array.isArray(rows) && rows.length) {
      return rows as { email: string; name: string; createdAt: string; lastLoginAt: string; loginCount: number; logins: LoginEvent[] }[];
    }
  } catch { /* fall through */ }
  if (dbEnabled()) {
    try {
      const [{ data: users }, { data: events }] = await Promise.all([
        supabase!.from("indy_users").select("email,name,created_at,last_login_at").order("last_login_at", { ascending: false }).limit(500),
        supabase!.from("indy_login_events").select("email,name,method,at").order("at", { ascending: false }).limit(1000),
      ]);
      const byEmail = new Map<string, LoginEvent[]>();
      for (const e of (events ?? []) as { email: string; name: string; method: string; at: string }[]) {
        const list = byEmail.get(e.email) ?? [];
        list.push({ account: e.email, name: e.name, method: e.method, at: e.at });
        byEmail.set(e.email, list);
      }
      return ((users ?? []) as { email: string; name: string; created_at: string; last_login_at: string }[]).map(u => ({
        email: u.email,
        name: u.name || u.email,
        createdAt: u.created_at ?? "",
        lastLoginAt: u.last_login_at ?? "",
        loginCount: byEmail.get(u.email)?.length ?? 0,
        logins: byEmail.get(u.email) ?? [],
      }));
    } catch { /* fall through to local */ }
  }
  const grouped = new Map<string, LoginEvent[]>();
  for (const e of readLoginLocal()) {
    const list = grouped.get(e.account) ?? [];
    list.push(e);
    grouped.set(e.account, list);
  }
  return [...grouped.entries()].map(([email, logins]) => ({
    email,
    name: logins[0]?.name || email,
    createdAt: logins[logins.length - 1]?.at ?? "",
    lastLoginAt: logins[0]?.at ?? "",
    loginCount: logins.length,
    logins: logins.sort((a, b) => (a.at < b.at ? 1 : -1)),
  }));
}

export function loginHistoryLocal(): LoginEvent[] {
  return readLoginLocal();
}

/** True when messages reach a shared store — the same-origin API. */
export function isSharedChat(): boolean {
  return true; // same-origin /api is always the shared store on every deploy
}

// ============================================================================
// Account notes, admin broadcasts, agent messages, document verification
// ============================================================================

export interface Note {
  id: string;
  text: string;
  at: string;
}

export interface AdminMessage {
  id: string;
  subject: string;
  text: string;
  at: string;
  read: boolean;
}

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  at: string;
}

const USER_KEY = "indy_user_notes";
const BROADCAST_KEY = "indy_admin_broadcasts";
const MESSAGE_KEY = "indy_admin_messages";
const READ_KEY = "indy_broadcast_read";

function account(): string {
  const profile = getStoredGoogleUser();
  return profile?.email ?? profile?.sub ?? "guest";
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const v = JSON.parse(raw) as T[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
}

function noteKey(): string {
  return `${USER_KEY}_${account()}`;
}

export function pushUserNote(text: string): void {
  const entry: Note = { id: `n-${Date.now().toString(36)}`, text, at: new Date().toISOString() };
  write(noteKey(), [entry, ...read<Note>(noteKey())].slice(0, 40));
  window.dispatchEvent(new Event("indy-notes"));
}

export function userNotes(): Note[] {
  return read<Note>(noteKey());
}

export function markUserNotesRead(): void {
  write(`${READ_KEY}_${account()}`, userNotes().map(n => n.id));
  window.dispatchEvent(new Event("indy-notes"));
}

export function unreadNoteCount(): number {
  const seen = read<string>(`${READ_KEY}_${account()}`);
  return userNotes().filter(n => !seen.includes(n.id)).length;
}

export function pushBroadcast(title: string, body: string): Broadcast {
  const entry: Broadcast = {
    id: `bc-${Date.now().toString(36)}`,
    title,
    body,
    at: new Date().toISOString(),
  };
  write(BROADCAST_KEY, [entry, ...read<Broadcast>(BROADCAST_KEY)].slice(0, 50));
  window.dispatchEvent(new Event("indy-notes"));
  return entry;
}

export function broadcasts(): Broadcast[] {
  return read<Broadcast>(BROADCAST_KEY);
}

export function unreadBroadcastCount(): number {
  const seen = read<string>(`${READ_KEY}_${account()}`);
  return broadcasts().filter(b => !seen.includes(b.id)).length;
}

export function markBroadcastsRead(): void {
  const seen = read<string>(`${READ_KEY}_${account()}`);
  write(`${READ_KEY}_${account()}`, [...seen, ...broadcasts().map(b => b.id)]);
  window.dispatchEvent(new Event("indy-notes"));
}

// --- Direct messages from an agent into the client's support widget ---

export interface AgentMessage {
  id: string;
  subject: string;
  text: string;
  at: string;
  read: boolean;
}

function agentMessagesKey(forAccount: string): string {
  return `${MESSAGE_KEY}_${forAccount || "guard"}`;
}

export function agentMessagesFor(forAccount: string): AgentMessage[] {
  return read<AgentMessage>(agentMessagesKey(forAccount));
}

export function unreadAgentMessageCount(forAccount: string): number {
  return agentMessagesFor(forAccount).filter(m => !m.read).length;
}

// --- Document verification: uploads auto-verify 30 minutes after capture ---

/** A newly uploaded document stays pending for 30 minutes, then reads verified. */
export const DOCUMENT_VERIFY_MS = 30 * 60 * 1000;

export function docStatus(atISO: string | undefined, now = Date.now()): {
  verified: boolean;
  dueAt: number;
} {
  const dueAt = atISO ? new Date(atISO).getTime() + DOCUMENT_VERIFY_MS : 0;
  return { verified: !!atISO && now >= dueAt, dueAt };
}

export function markAgentMessagesRead(forAccount: string): void {
  write(agentMessagesKey(forAccount), agentMessagesFor(forAccount).map(m => ({ ...m, read: true })));
  window.dispatchEvent(new Event("indy-messages"));
}

export function sendAgentMessage(forAccount: string, subject: string, text: string): AgentMessage {
  const entry: AgentMessage = {
    id: `am-${Date.now().toString(36)}`,
    subject,
    text,
    at: new Date().toISOString(),
    read: false,
  };
  write(agentMessagesKey(forAccount), [...read<AgentMessage>(agentMessagesKey(forAccount)), entry]);
  window.dispatchEvent(new Event("indy-messages"));
  return entry;
}

/** Messages for the currently signed-in account's widget. */
export function myAgentMessages(): AgentMessage[] {
  return agentMessagesFor(account());
}

export function unreadMyAgentMessages(): number {
  return unreadAgentMessageCount(account());
}
