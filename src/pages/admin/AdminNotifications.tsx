import { useState } from 'react';
import { Send, BellRing } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { broadcasts, pushBroadcast } from '../../lib/notes';
import { useOrdersSync } from '../../lib/useOrdersSync';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);
  const [list] = useOrdersSync(() => broadcasts());

  const send = () => {
    if (!title.trim() || !body.trim()) return;
    pushBroadcast(title.trim(), body.trim());
    setTitle('');
    setBody('');
    setSent(true);
    setTimeout(() => setSent(false), 1800);
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="font-mono font-700 text-xl text-[#0A0B0D]">Notifications</h1>
            <p className="text-xs text-black/30 font-mono mt-1">
              Send a broadcast that appears in every user's notification bell
            </p>
          </div>
          <BellRing size={16} className="text-[#2F6BFF] shrink-0" />
        </div>

        <div className="bg-white border border-black/5 rounded-xl p-6">
          <label className="block text-xs text-black/40 mb-2 font-mono">TITLE</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="For example, Markets resume Monday"
            className="w-full bg-black/3 border border-black/8 rounded-lg px-4 py-2.5 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF]/50 mb-4"
          />
          <label className="block text-xs text-black/40 mb-2 font-mono">MESSAGE</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write the announcement that will be delivered to all clients..."
            rows={5}
            className="w-full bg-black/3 border border-black/8 rounded-lg px-4 py-2.5 text-sm text-[#0A0B0D] outline-none focus:border-[#2F6BFF]/50 mb-4"
          />
          <button
            onClick={send}
            disabled={!title.trim() || !body.trim()}
            className="flex items-center gap-2 w-full py-3 rounded-xl bg-[#2F6BFF] text-sm text-white font-mono hover:bg-[#4F82FF] transition-colors disabled:opacity-50 justify-center"
          >
            <Send size={14} /> {sent ? 'Broadcast sent' : 'Send to all users'}
          </button>
        </div>

        <div className="mt-6">
          <h2 className="font-mono text-sm text-black/70 mb-3">Sent broadcasts</h2>
          {list.length === 0 ? (
            <p className="px-5 py-6 text-xs text-black/30 font-mono bg-white border border-black/5 rounded-xl">
              No broadcasts yet. Announcements you send appear here and in every client's notification bell.
            </p>
          ) : (
            <div className="divide-y divide-black/5 bg-white border border-black/5 rounded-xl">
              {list.map(b => (
                <div key={b.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-black/80">{b.title}</span>
                    <span className="text-[10px] text-black/25 font-mono">
                      {new Date(b.at).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-black/50 mt-1 leading-relaxed">{b.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}