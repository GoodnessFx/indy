// Support chat shared by the client widget and the admin inbox.
//
// One conversation per client account. Both sides read and write the same
// thread, so a client can send a message, close the browser, come back later,
// and the conversation continues from where it stopped.
//
// Storage: always writes to localStorage first (works offline and on a fresh
// browser), and when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set every
// message also goes to the support_messages table, so an admin can sign in from
// any device anywhere and reply to the same thread. See supabase/chat.sql.

import { getStoredGoogleUser } from "./googleAuth";
import { supabase, isSupabaseConfigured } from "./supabase";

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
const REMOTE_TABLE = "support_messages";

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
  void pushRemote(message);
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
  void pushRemote(message);
  return message;
}

/** Marks every client message as seen by the admin console. */
export function markThreadSeen(account: string): void {
  const threads = readAll();
  if (!threads[account]) return;
  threads[account] = threads[account].map(m => (m.from === "client" ? { ...m, seen: true } : m));
  writeAll(threads);
}

// --- Remote sync (Supabase), optional but enabled by env vars ---

async function pushRemote(message: ChatMessage): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from(REMOTE_TABLE).upsert({
      id: message.id,
      account: message.account,
      name: message.name,
      sender: message.from,
      body: message.text,
      sent_at: message.at,
    });
  } catch { /* remote optional, local copy already saved */ }
}

/** Pull remote messages down and merge them into the local thread store. */
export async function refreshChat(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data, error } = await supabase
      .from(REMOTE_TABLE)
      .select("id, account, name, sender, body, sent_at")
      .order("sent_at", { ascending: true })
      .limit(500);
    if (error || !data?.length) return;
    const threads = readAll();
    let changed = false;
    for (const row of data as { id: string; account: string; name: string; sender: string; body: string; sent_at: string }[]) {
      const account = row.account;
      const list = threads[account] ?? [];
      if (list.some(m => m.id === row.id)) continue;
      const existing = list.find(m => m.id === row.id);
      list.push({
        id: row.id,
        account,
        name: row.name,
        from: row.sender === "agent" ? "agent" : "client",
        text: row.body,
        at: row.sent_at,
        seen: existing?.seen ?? false,
      });
      threads[account] = list.sort((a, b) => (a.at < b.at ? -1 : 1));
      changed = true;
    }
    if (changed) writeAll(threads);
  } catch { /* remote optional */ }
}

/** True when messages will also be shared across devices. */
export const chatIsRemote = isSupabaseConfigured;

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
