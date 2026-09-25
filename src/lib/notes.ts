// Shared chat layer: client widget <-> admin inbox.
//
// One conversation per client account. Both sides read and write the same
// conversation, so a client can send a message from one device, the admin can
// reply from anywhere else in the world, and the client resumes exactly where
// they stopped.
//
// Where it lives, in order of preference:
//   1. Local API (/api/chat/...). On Render the Web Service runs server.js next
//      to the built frontend, so every device shares one message store.
//      The server entrypoint only uses the Node standard library (no new
//      dependencies), and server/data/store.json is the single file holding
//      every chat row.
//   2. localStorage mirror per account, so the thread opens instantly, works
//      offline, and survives a server restart on this device.
//
// No database, no tables, no SDK. Plain HTTP JSON rows keyed by account email,
// the same pattern as the reference repo.

import { getStoredGoogleUser } from "./googleAuth";

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

const LOCAL_KEY = "indy_chat_threads";

type Threads = Record<string, ChatMessage[]>;

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

// --- JSON API helpers (server.js /api/chat) ---

async function apiRequest(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(path, {
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
    at: String(row.at ?? row.sent_at ?? new Date().toISOString()),
    seen: row.seen ?? false,
  };
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
 * Fetch all conversations directly from the server and return them, bypassing
 * localStorage. Used by the admin inbox for true cross-device visibility.
 */
export async function fetchAllFromServer(): Promise<{ account: string; name: string; messages: ChatMessage[]; lastAt: string; unread: number }[]> {
  try {
    const rows = (await apiRequest(`/api/chat/all?t=${Date.now()}`)) as unknown;
    if (!Array.isArray(rows)) return [];
    const byAccount = new Map<string, ChatMessage[]>();
    for (const m of (rows as Parameters<typeof toChatMessage>[0][]).map(toChatMessage)) {
      const list = byAccount.get(m.account) ?? [];
      list.push(m);
      byAccount.set(m.account, list);
    }
    const result: { account: string; name: string; messages: ChatMessage[]; lastAt: string; unread: number }[] = [];
    for (const [account, messages] of byAccount) {
      const sorted = messages.sort((a, b) => (a.at < b.at ? -1 : 1));
      result.push({
        account,
        name: sorted.find(m => m.from === 'client')?.name || account,
        messages: sorted,
        lastAt: sorted[sorted.length - 1]?.at ?? '',
        unread: sorted.filter(m => m.from === 'client' && !m.seen).length,
      });
    }
    // Also merge into local store so offline fallback stays warm
    for (const [account, messages] of byAccount) mergeServer(account, messages);
    return result.sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  } catch {
    // Fallback: read from local mirror
    return conversations();
  }
}

async function pushServer(payload: {
  id?: string;
  account: string;
  name: string;
  sender: "client" | "agent";
  body: string;
  at?: string;
}): Promise<boolean> {
  try {
    await apiRequest("/api/chat/send", { method: "POST", body: JSON.stringify(payload) });
    return true;
  } catch {
    return false;
  }
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
 * Pull one thread from the API, merge locally, and return the merged list.
 * This is the authoritative read path for the client widget.
 */
export async function refreshThread(account: string): Promise<ChatMessage[]> {
  const server = await pullThread(account);
  if (server.length) {
    for (const m of server) mergeServer(account, [m]);
  }
  // Return the freshest data: prefer server rows if we got any, else local
  return server.length ? server.sort((a, b) => (a.at < b.at ? -1 : 1)) : threadFor(account);
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
  } catch { /* API optional */ }
}

/** True when messages reach the shared server, i.e. across devices. */
export let chatIsRemote = false;

async function probeApi(): Promise<void> {
  try {
    await apiRequest("/api/chat/all");
    chatIsRemote = true;
  } catch {
    chatIsRemote = false;
  }
}

void probeApi();

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
