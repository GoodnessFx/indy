import { useState } from 'react';
import { MessageCircle, X, Send, Search, ChevronDown, Paperclip, Clock, CheckCircle, AlertCircle } from 'lucide-react';

type Tab = 'chat' | 'tickets' | 'help';

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('chat');
  const [input, setInput] = useState('');
  const [helpSearch, setHelpSearch] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [humanRequested, setHumanRequested] = useState(false);

  const [messages, setMessages] = useState([
    { id: 1, from: 'support', text: 'Hi Marcus! How can we help you today?', time: '09:00' },
  ]);
  const [quickReplies] = useState([
    "Where's my withdrawal?",
    'How do fees work?',
    'Verify my identity',
    'Talk to a human',
  ]);

  const tickets = [
    { id: 'TK-2841', subject: 'Withdrawal delay inquiry', status: 'Open', updated: '2h ago' },
    { id: 'TK-2809', subject: 'KYC document re-submission', status: 'Waiting on you', updated: '3d ago' },
    { id: 'TK-2750', subject: 'Deposit confirmation', status: 'Resolved', updated: '1w ago' },
  ];

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
    const time = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text, time }]);
    setInput('');

    if (text === 'Talk to a human') {
      setHumanRequested(true);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          from: 'support',
          text: 'Connecting you to a human agent. Estimated wait time: 3 minutes.',
          time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        }]);
      }, 1000);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          from: 'support',
          text: 'Thanks for your message. A support agent will respond shortly. In the meantime, check our Help Center for quick answers.',
          time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        }]);
      }, 1200);
    }
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
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl btn-primary flex items-center justify-center shadow-2xl glow-pulse"
        aria-label="Open support"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-[10px] font-bold text-[#0A0B0D]">3</span>
        )}
      </button>

      {/* Widget panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] glass rounded-2xl border border-black/8 shadow-2xl overflow-hidden slide-in-right flex flex-col" style={{ maxHeight: '520px' }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-black/8 flex items-center justify-between bg-gradient-to-r from-[#ffffff] to-[#0d1020]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#2F6BFF] flex items-center justify-center">
                <MessageCircle size={14} className="text-[#0A0B0D]" />
              </div>
              <div>
                <p className="font-display font-600 text-sm text-[#0A0B0D]">IndySolutions Support</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
                  <span className="text-[10px] text-black/40">Online, Avg. reply 3 min</span>
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
                {t === 'tickets' && <span className="ml-1 text-[10px] bg-black/10 px-1.5 py-0.5 rounded-full">3</span>}
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

                {/* Quick replies */}
                {messages.length === 1 && (
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
                <div className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-sm text-[#0A0B0D] placeholder-black/25 outline-none"
                  />
                  <button className="text-black/30 hover:text-black/60 transition-colors"><Paperclip size={14} /></button>
                  <button onClick={() => sendMessage(input)} className="w-7 h-7 bg-[#2F6BFF] rounded-lg flex items-center justify-center hover:bg-[#4F82FF] transition-colors">
                    <Send size={12} className="text-[#0A0B0D]" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tickets tab */}
          {tab === 'tickets' && (
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '340px' }}>
              {tickets.map(ticket => (
                <div key={ticket.id} className="px-4 py-3 border-b border-black/5 hover:bg-black/3 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black/80 truncate">{ticket.subject}</p>
                      <p className="text-xs text-black/30 mt-0.5">{ticket.id}, Updated {ticket.updated}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {ticketStatusIcon(ticket.status)}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ticketChipClass(ticket.status)}`}>{ticket.status}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4">
                <button className="w-full text-center text-xs text-black/30 py-2 bg-black/3 rounded-xl hover:bg-black/5 transition-colors">
                  + New support request
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
