import { useState, useEffect } from 'react';
import { Send, MessageSquare, Smile, RefreshCw } from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  chatIsRemote,
  conversations,
  markThreadSeen,
  refreshChat,
  markThreadSeenRemote,
  sendAgent,
  threadFor,
  type ChatMessage,
} from '../../lib/notes';

// Support inbox built on the same chat store the client widget writes to. A
// message a signed-in client sends shows up here immediately, the admin can
// reply with emoji included, and the conversation is kept so it can be picked
// up again later from the same or another device, because every row also lives
// in the shared JSON store served at /api/chat by server.js.

const EMOJIS = ['👍', '🙏', '😊', '🎉', '✅', '👋', '💰', '📈', '🔒', '⚡', '🤝', '🔥'];

export default function AdminSupport() {
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [list, setList] = useState(() => conversations());
  const [, setTick] = useState(0);

  const sync = () => setList(conversations());

  useEffect(() => {
    void refreshChat();
    sync();
    const local = () => sync();
    window.addEventListener('indy-chat', local);
    window.addEventListener('storage', local);
    const timer = window.setInterval(() => {
      void refreshChat();
      sync();
    }, 8000);
    return () => {
      window.removeEventListener('indy-chat', local);
      window.removeEventListener('storage', local);
      window.clearInterval(timer);
    };
  }, []);

  const activeAccount = selected ?? list[0]?.account ?? null;
  const activeName = list.find(c => c.account === activeAccount)?.name ?? activeAccount ?? '';
  const messages: ChatMessage[] = activeAccount ? threadFor(activeAccount) : [];

  useEffect(() => {
    if (activeAccount && messages.some(m => m.from === 'client' && !m.seen)) {
      markThreadSeen(activeAccount);
      void markThreadSeenRemote(activeAccount);
      setTick(t => t + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount, messages.length]);

  const send = () => {
    if (!reply.trim() || !activeAccount) return;
    sendAgent(activeAccount, reply.trim());
    setReply('');
    setEmojiOpen(false);
    sync();
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-mono font-700 text-xl text-[#0A0B0D]">Support Inbox</h1>
            <p className="text-xs text-black/30 font-mono mt-1">
              {chatIsRemote
                ? 'Synced, reachable from any device'
                : 'Local store, add Supabase env vars for cross device sync'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] font-mono">
              {list.length} conversation{list.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => { void refreshChat(); sync(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-black/8 text-[11px] text-black/40 hover:text-black/70 transition-colors font-mono"
              aria-label="Refresh conversations"
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
        </div>
        <div className="bg-white border border-black/5 rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[440px]">
          {/* Conversation list */}
          <div className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-black/5 flex flex-col max-h-[40vh] md:max-h-none overflow-y-auto">
            {list.length === 0 && (
              <div className="px-5 py-10 text-center">
                <MessageSquare size={26} className="text-black/15 mx-auto mb-3" />
                <p className="text-xs text-black/40 mb-1">No conversations yet</p>
                <p className="text-[11px] text-black/25 leading-relaxed">
                  Every message a signed-in client sends arrives here immediately.
                </p>
              </div>
            )}
            {list.map(c => {
              const last = c.messages[c.messages.length - 1];
              const unread = c.messages.filter(m => m.from === 'client' && !m.seen).length;
              const active = c.account === activeAccount;
              return (
                <button
                  key={c.account}
                  onClick={() => { setSelected(c.account); markThreadSeen(c.account); void markThreadSeenRemote(c.account); sync(); setTick(t => t + 1); }}
                  className={`w-full text-left px-4 py-3.5 border-b border-black/3 hover:bg-black/2 transition-colors ${active ? 'bg-[#2F6BFF]/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-mono text-xs text-black/70 truncate max-w-[150px]">{c.name}</span>
                    <span className="font-mono text-[9px] text-black/25 shrink-0">
                      {last ? new Date(last.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-black/40 truncate">{c.account}</p>
                  {unread > 0 && (
                    <span className="inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-[#2F6BFF] text-white font-mono">
                      {unread} new
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Conversation */}
          {activeAccount && list.length > 0 ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-4 sm:px-6 py-4 border-b border-black/5 bg-white flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-black/80 truncate">{activeName}</p>
                  <p className="font-mono text-xs text-black/30 truncate">{activeAccount}</p>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] font-mono shrink-0">Open</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-h-[45vh] md:max-h-[430px]">
                {messages.length === 0 && (
                  <p className="text-xs text-black/30 text-center py-6">No messages in this conversation yet.</p>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                      msg.from === 'agent'
                        ? 'bg-[#2F6BFF]/15 text-[#1D3B8F] rounded-br-md'
                        : 'bg-black/5 text-black/80 rounded-bl-md'
                    }`}>
                      <p>{msg.text}</p>
                      <p className="text-[10px] mt-1 opacity-50">
                        {msg.from === 'agent' ? 'You' : msg.name}, {new Date(msg.at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 sm:p-4 border-t border-black/5 bg-white">
                {emojiOpen && (
                  <div className="mb-2 grid grid-cols-6 sm:grid-cols-8 gap-1 rounded-xl border border-black/8 bg-white p-2 shadow">
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setReply(v => v + e)}
                        className="h-8 text-lg leading-none rounded hover:bg-black/5 transition-colors"
                        aria-label="Add emoji to reply"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder={`Reply to ${activeName || activeAccount}...`}
                    className="flex-1 min-w-0 bg-black/3 border border-black/8 rounded-lg px-4 py-2.5 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF]/40"
                  />
                  <button
                    onClick={() => setEmojiOpen(o => !o)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${emojiOpen ? 'border-[#2F6BFF]/40 text-[#2F6BFF]' : 'border-black/8 text-black/40 hover:text-black/70'}`}
                    aria-label="Add emoji"
                  >
                    <Smile size={15} />
                  </button>
                  <button
                    onClick={send}
                    className="w-9 h-9 rounded-lg bg-[#2F6BFF] flex items-center justify-center hover:bg-[#4F82FF] transition-colors shrink-0"
                    aria-label="Send reply"
                  >
                    <Send size={14} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <p className="text-sm text-black/35 text-center">
                Pick a conversation, or ask a client to send a message from their support widget.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}