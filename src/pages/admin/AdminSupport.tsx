import { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { allTickets } from '../../lib/audit';
import { sendAgentMessage, agentMessagesFor } from '../../lib/notes';
import { useOrdersSync } from '../../lib/useOrdersSync';

// The inbox shows only real tickets raised by signed-in clients. A fresh
// install shows an empty inbox rather than sample conversations.

export default function AdminSupport() {
  const [feed] = useOrdersSync(() => allTickets());
  const [selected, setSelected] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [reply, setReply] = useState('');

  const threads = feed.map(t => ({
    id: t.id,
    user: t.account,
    subject: t.subject,
    status: t.status,
    last: new Date(t.updatedAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    openedAt: t.updatedAt,
    unread: t.status === 'Open',
  }));

  const filteredThreads = threads.filter(t => statusFilter === 'All' || t.status === statusFilter);
  const currentThread = threads.find(t => t.id === selected) ?? filteredThreads[0] ?? threads[0];
  const agentMsgs = currentThread ? agentMessagesFor(currentThread.user) : [];
  const currentMessages: { from: 'user' | 'support'; text: string; time: string }[] = currentThread
    ? [
        { from: 'user', text: currentThread.subject, time: new Date(currentThread.openedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) },
        ...agentMsgs.map(m => ({ from: 'support' as const, text: m.text, time: new Date(m.at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) })),
      ]
    : [];

  const sendReply = () => {
    if (!reply.trim() || !currentThread) return;
    // Write straight to the client's support widget inbox.
    sendAgentMessage(currentThread.user, currentThread.subject, reply);
    setReply('');
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl -m-8 h-screen flex overflow-hidden">
        {/* Thread list */}
        <div className="w-72 shrink-0 border-r border-black/5 flex flex-col bg-white">
          <div className="p-4 border-b border-black/5">
            <h2 className="font-mono text-xs text-black/50 uppercase tracking-wider mb-3">Support Inbox</h2>
            <div className="flex items-center gap-1">
              {['All', 'Open', 'Waiting on you', 'Resolved'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`text-[9px] px-2 py-1 rounded font-mono transition-colors whitespace-nowrap ${
                    statusFilter === s ? 'bg-[#2F6BFF]/20 text-[#2F6BFF]' : 'text-black/25 hover:text-black/50'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 && (
              <div className="px-5 py-10 text-center">
                <MessageSquare size={26} className="text-black/15 mx-auto mb-3" />
                <p className="text-xs text-black/40 mb-1">No client tickets yet</p>
                <p className="text-[11px] text-black/25 leading-relaxed">
                  Tickets raised by signed-in clients land here in real time.
                </p>
              </div>
            )}
            {filteredThreads.map(t => (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-black/3 hover:bg-black/2 transition-colors ${selected === t.id ? 'bg-black/3' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {t.unread && <div className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />}
                    <span className="font-mono text-xs text-black/70 truncate max-w-[120px]">{t.user}</span>
                  </div>
                  <span className="font-mono text-[9px] text-black/20 shrink-0">{t.last}</span>
                </div>
                <p className="font-mono text-[10px] text-black/40 truncate">{t.subject}</p>
                <span className={`text-[9px] font-mono mt-1 inline-block ${
                  t.status === 'Resolved' ? 'text-[#22C55E]/50' : t.status === 'Waiting on you' ? 'text-[#F59E0B]/50' : 'text-[#2F6BFF]/50'
                }`}>{t.status}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        {currentThread && (
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-black/5 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-black/80">{currentThread.subject}</p>
                  <p className="font-mono text-xs text-black/30">{currentThread.id}, {currentThread.user}</p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono ${
                  currentThread.status === 'Resolved' ? 'chip-gain' : currentThread.status === 'Waiting on you' ? 'chip-warning' : 'chip-accent'
                }`}>{currentThread.status}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'support' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-xl px-4 py-3 text-xs font-mono ${
                    msg.from === 'support' ? 'bg-[#2F6BFF]/20 text-[#2F6BFF]' : 'bg-black/5 text-black/70'
                  }`}>
                    <p>{msg.text}</p>
                    <p className="text-[10px] mt-1 opacity-50">{msg.from === 'support' ? 'Admin' : currentThread.user}, {msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-black/5 bg-white">
              <div className="flex items-center gap-3">
                <input value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendReply()}
                  placeholder="Type a reply..."
                  className="flex-1 bg-black/3 border border-black/8 rounded-lg px-4 py-2.5 text-xs text-[#0A0B0D] font-mono outline-none focus:border-[#2F6BFF]/40" />
                <button onClick={sendReply} className="w-9 h-9 rounded-lg bg-[#2F6BFF]/20 flex items-center justify-center hover:bg-[#2F6BFF]/30 transition-colors">
                  <Send size={13} className="text-[#2F6BFF]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
