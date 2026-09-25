import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Search, ChevronDown, Paperclip, Clock, CheckCircle, AlertCircle, Plus, Smile } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { createTicket, myTickets } from '../lib/audit';
import { currentAccount, sendClient, threadFor, refreshThread } from '../lib/notes';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useOrdersSync } from '../lib/useOrdersSync';

type Tab = 'chat' | 'tickets' | 'help';

const EMOJIS = ['👍', '🙏', '😊', '🎉', '✅', '👋', '💰', '📈', '🔒', '⚡', '🤝', '🔥'];

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('chat');
  const [input, setInput] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [helpSearch, setHelpSearch] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [humanRequested, setHumanRequested] = useState(false);
  const [showingGate, setShowingGate] = useState(false);
  const { signedIn, profile } = useAuth();
  const firstName = (profile?.given_name || profile?.name || '').split(' ')[0];

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    // @ts-ignore
    e.target.releasePointerCapture(e.pointerId);
  };

  // Let the Contact page ("Talk to an agent") and any other surface open this
  // widget without reaching into its internals. The widget applies the gating.
  useEffect(() => {
    const openMe = () => setOpen(true);
    window.addEventListener('indy-open-support', openMe);
    return () => window.removeEventListener('indy-open-support', openMe);
  }, []);

  // The conversation is stored, so it survives sign out, refresh, and new
  // sessions: the client always continues from where they left off. Remote
  // messages are pulled in every 8 seconds when Supabase is configured, which
  // is how an admin on another device reaches this thread.
  const [thread, setThread] = useState(() => {
  const account = currentAccount().account;
  if (isSupabaseConfigured && supabase) {
    return threadFor(account);
  }
  try {
    return JSON.parse(localStorage.getItem(`support_thread_${account}`) || '[]');
  } catch {
    return [];
  }
});
  const [acks, setAcks] = useState<{ id: string; from: 'support'; text: string; time: string }[]>([]);

  useEffect(() => {
    const syncLocal = () => setThread(threadFor(currentAccount().account));
    const pull = async () => {
      const fresh = await refreshThread(currentAccount().account);
      if (fresh.length) {
        setThread([...fresh]);
      } else {
        syncLocal();
      }
    };
    window.addEventListener('indy-chat', syncLocal);
    window.addEventListener('storage', syncLocal);
    window.addEventListener('indy-auth', syncLocal);
    void pull();
    const t = window.setInterval(pull, 3000);
    return () => {
      window.removeEventListener('indy-chat', syncLocal);
      window.removeEventListener('storage', syncLocal);
      window.removeEventListener('indy-auth', syncLocal);
      window.clearInterval(t);
    };
  }, []);

  const messages: { id: string; from: string; text: string; time: string }[] = [
    ...(thread.length === 0
      ? [{
          id: 'welcome',
          from: 'support',
          text: firstName ? `Hi ${firstName}, how can we help you today?` : 'Hi, how can we help you today?',
          time: '09:00',
        }]
      : []),
    ...thread.map(m => ({
      id: m.id,
      from: m.from === 'client' ? 'user' : 'support',
      text: m.text,
      time: new Date(m.at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    })),
    ...acks,
  ];

  const [quickReplies] = useState([
    "Where's my withdrawal?",
    'How do fees work?',
    'Verify my identity',
    'Talk to an agent',
  ]);

  const [tickets] = useOrdersSync(() => myTickets());

  const helpTopics = [
    {
      category: 'Withdrawals & Fees',
      questions: [
        { q: 'How long do withdrawals take?', a: 'Bank transfers take 1-3 business days. Card withdrawals are instant to 24 hours.' },
        { q: 'What fees apply to withdrawals?', a: 'A 0.4% service fee applies, plus any FX conversion fees if your payout currency differs.' },
      ],
    },
    {
      category: 'NFTs',
      questions: [
        { q: 'How do I purchase an NFT?', a: 'Browse the NFT marketplace, click any asset, and use the "Buy Now" button. Funds are deducted from your account balance.' },
      ],
    },
    {
      category: 'Stocks',
      questions: [
        { q: 'What markets can I trade?', a: 'IndySolutions supports US equities, major ETFs, and thematic baskets including Space Economy stocks.' },
      ],
    },
    {
      category: 'Identity Verification',
      questions: [
        { q: 'Why was my KYC rejected?', a: 'Common reasons: blurry document photo, expired ID, or mismatched name. Check the rejection reason in Settings > Verification.' },
      ],
    },
  ];

  const filteredHelp = helpTopics.map(topic => ({
    ...topic,
    questions: topic.questions.filter(q =>
      !helpSearch || q.q.toLowerCase().includes(helpSearch.toLowerCase())
    ),
  })).filter(topic => topic.questions.length > 0);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    if (!signedIn) {
      setShowingGate(true);
      setOpen(false);
      return;
    }
    sendClient(text.trim());
    setInput('');
    setEmojiOpen(false);

    if (text === 'Talk to an agent') {
      setHumanRequested(true);
      window.setTimeout(() => {
        setAcks(prev => [...prev, {
          id: `ack-${Date.now()}`,
          from: 'support',
          text: 'Connecting you to a human agent. Estimated wait time: 3 minutes.',
          time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        }]);
      }, 1000);
      return;
    }
    window.setTimeout(() => {
      setAcks(prev => [...prev, {
        id: `ack-${Date.now()}`,
        from: 'support',
        text: 'Thanks for your message. A support agent will respond shortly. In the meantime, check our Help Center for quick answers.',
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 1200);
  };

  const ticketStatusIcon = (status: string) => {
    if (status === 'Resolved') return <CheckCircle size={13} className="text-[#22C55E]" />;
    if (status === 'Waiting on you') return <AlertCircle size={13} className="text-[#F59E0B]" />;
    return <Clock size={13} className="text-[#2F6BFF]" />;
  };

  const ticketChipClass = (status: string) => {
    if (status === 'Resolved') return 'chip-gain';
    if (status === 'Waiting on you') return 'chip-warning';
    return 'chip-accent';
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => {
          if (!signedIn) { setShowingGate(!showingGate); setOpen(false); }
          else { setOpen(!open); setShowingGate(false); }
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl btn-primary flex items-center justify-center shadow-2xl"
        aria-label="Open support"
      >
        {open || showingGate ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Sign-in gate, shown before the chat opens (also a mobile sheet) */}
      {showingGate && !signedIn && (
        <>
          <div className="fixed inset-x-0 sm:right-6 bottom-6 z-[60]">
            <div className="fixed inset-0 bg-black/40 z-[59] sm:hidden" onClick={() => setShowingGate(false)} aria-hidden="true" />
            <div className="w-[340px] max-w-[calc(100vw-2rem)] mx-auto sm:mx-0 glass rounded-2xl sm:rounded-r-2xl rounded-b-2xl sm:rounded-l-2xl border border-black/8 shadow-2xl slide-up transition-all sm:bottom-6">
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/8">
                <span className="text-sm font-semibold text-[#0A0B0D]">Chat with support</span>
                <button onClick={() => setShowingGate(false)} className="text-black/40 hover:text-black/70"><X size={15} /></button>
              </div>
              <div className="px-5 py-7 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#2F6BFF]/12 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={22} className="text-[#2F6BFF]" />
                </div>
                <p className="text-base font-semibold text-[#0A0B0D] mb-1">Sign in to chat with support</p>
                <p className="text-sm text-black/45 leading-relaxed mb-5">
                  Your name and account context are carried automatically once you sign in.
                </p>
                <Link to="/login" className="btn-primary w-full py-3 rounded-xl text-sm block text-center">Sign in</Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Widget panel */}
      {open && (
        <div 
          className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] glass rounded-2xl border border-black/8 shadow-2xl overflow-hidden slide-in-right flex flex-col" 
          style={{ 
            maxHeight: '520px', 
            transform: `translate(${position.x}px, ${position.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s'
          }}
        >
          {/* Header */}
          <div 
            className="px-4 py-3 border-b border-black/8 flex items-center justify-between bg-white cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#2F6BFF] flex items-center justify-center">
                <MessageCircle size={14} className="text-white" />
              </div>
              <div>
                <p className="font-display font-600 text-sm text-[#0A0B0D]">Indy Digital Marketing Solutions Support</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
                  <span className="text-[10px] text-black/40">
                    {firstName ? `Signed in as ${firstName}` : 'Online, Avg. reply 3 min'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-black/8">
            {(['chat', 'tickets', 'help'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                  tab === t ? 'text-[#2F6BFF] border-b-2 border-[#2F6BFF]' : 'text-black/40 hover:text-black/70'
                }`}
              >
                {t === 'tickets' ? 'My Tickets' : t === 'help' ? 'Help Center' : 'Chat'}
                {t === 'tickets' && tickets.length > 0 && <span className="ml-1 text-[10px] bg-black/10 px-1.5 py-0.5 rounded-full">{tickets.length}</span>}
              </button>
            ))}
          </div>

          {/* Chat tab */}
          {tab === 'chat' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '280px' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.from === 'user' ? 'bg-[#2F6BFF] text-white rounded-br-md' : 'bg-black/8 text-black/85 rounded-bl-md'
                    }`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.from === 'user' ? 'text-black/60' : 'text-black/30'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
                {humanRequested && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-xs text-black/40 bg-black/5 px-3 py-1.5 rounded-full">
                      <Clock size={11} /> Connecting to human agent...
                    </div>
                  </div>
                )}

                {/* Quick replies, only before the client has spoken */}
                {thread.length === 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {quickReplies.map(qr => (
                      <button
                        key={qr}
                        onClick={() => sendMessage(qr)}
                        className="text-xs px-3 py-1.5 rounded-full border border-black/15 text-black/60 hover:border-[#2F6BFF] hover:text-[#2F6BFF] transition-colors"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-black/8">
                {emojiOpen && (
                  <div className="mb-2 grid grid-cols-6 gap-1 rounded-xl border border-black/8 bg-white p-2 shadow-lg">
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setInput(v => v + e)}
                        className="h-8 text-lg leading-none rounded hover:bg-black/5 transition-colors"
                        aria-label={`Insert ${e}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-sm text-[#0A0B0D] placeholder-black/25 outline-none min-w-0"
                  />
                  <button
                    onClick={() => setEmojiOpen(o => !o)}
                    className={`transition-colors ${emojiOpen ? 'text-[#2F6BFF]' : 'text-black/30 hover:text-black/60'}`}
                    aria-label="Add emoji"
                  >
                    <Smile size={15} />
                  </button>
                  <button className="text-black/30 hover:text-black/60 transition-colors" aria-label="Attach a file"><Paperclip size={14} /></button>
                  <button onClick={() => sendMessage(input)} className="w-7 h-7 bg-[#2F6BFF] rounded-lg flex items-center justify-center hover:bg-[#4F82FF] transition-colors shrink-0">
                    <Send size={12} className="text-[#0A0B0D]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tickets tab, strictly this account's own tickets */}
          {tab === 'tickets' && (
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '340px' }}>
              {tickets.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <Clock size={26} className="text-black/15 mx-auto mb-3" />
                  <p className="text-sm text-black/50 mb-1">No requests yet</p>
                  <p className="text-xs text-black/30 leading-relaxed mb-4">
                    Support tickets you open will appear here with their status.
                  </p>
                </div>
              )}
              {tickets.map(ticket => (
                <div key={ticket.id} className="px-4 py-3 border-b border-black/5 hover:bg-black/3 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black/80 truncate">{ticket.subject}</p>
                      <p className="text-xs text-black/30 mt-0.5">
                        {ticket.id}, Updated {new Date(ticket.updatedAt).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ticketStatusIcon(ticket.status)}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ticketChipClass(ticket.status)}`}>{ticket.status}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4">
                <button
                  onClick={() => {
                    const lastUser = [...messages].reverse().find(m => m.from === 'user');
                    createTicket(lastUser?.text.slice(0, 60) || 'Support request');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-black/40 py-2 bg-black/3 rounded-xl hover:bg-black/5 transition-colors"
                >
                  <Plus size={12} /> New support request
                </button>
              </div>
            </div>
          )}

          {/* Help tab */}
          {tab === 'help' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="p-3 border-b border-black/8">
                <div className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2">
                  <Search size={13} className="text-black/30" />
                  <input
                    value={helpSearch}
                    onChange={e => setHelpSearch(e.target.value)}
                    placeholder="Search help articles..."
                    className="flex-1 bg-transparent text-sm text-[#0A0B0D] placeholder-black/25 outline-none"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: '310px' }}>
                {filteredHelp.map(topic => (
                  <div key={topic.category}>
                    <div className="px-4 py-2 bg-black/3">
                      <p className="text-[10px] font-600 text-black/40 uppercase tracking-wider font-display">{topic.category}</p>
                    </div>
                    {topic.questions.map(qa => (
                      <div key={qa.q} className="border-b border-black/5">
                        <button
                          onClick={() => setOpenAccordion(openAccordion === qa.q ? null : qa.q)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/3 transition-colors"
                        >
                          <span className="text-sm text-black/70">{qa.q}</span>
                          <ChevronDown size={13} className={`text-black/30 shrink-0 transition-transform ${openAccordion === qa.q ? 'rotate-180' : ''}`} />
                        </button>
                        {openAccordion === qa.q && (
                          <div className="px-4 pb-3">
                            <p className="text-xs text-black/40 leading-relaxed">{qa.a}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
