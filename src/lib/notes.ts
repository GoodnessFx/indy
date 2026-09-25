// In-app notifications and admin messaging.
//
// Three streams, all per account where relevant:
// 1. Account notifications (card scanned, avatar uploaded, docs uploaded).
// 2. Admin broadcasts, readable by every user.
// 3. Direct messages from an admin agent into the support chat widget.
//
// Persisted in localStorage. Moving to Supabase later keeps these same
// function names and swaps the storage layer for realtime channels.

import { getStoredGoogleUser } from "./googleAuth";

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
