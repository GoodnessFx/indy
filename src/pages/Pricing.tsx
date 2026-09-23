import { useState } from 'react';
import { Info, Calculator } from 'lucide-react';
import FxCalculator from '../components/FxCalculator';

const fees = [
  { type: 'Deposit', nfts: 'Free', stocks: 'Free', other: 'Free', notes: 'Bank transfer free. Card: 1.5%.' },
  { type: 'Withdrawal (same currency)', nfts: '0.4%', stocks: '0.4%', other: '0.4%', notes: 'Minimum fee $2.' },
  { type: 'FX Conversion', nfts: '0.6%', stocks: '0.6%', other: '0.6%', notes: 'Spread over mid-market rate.' },
  { type: 'Trading commission', nfts: '1.0%', stocks: '0.1%', other: '1.5%', notes: 'NFT: maker/taker. Stocks: per trade.' },
  { type: 'Platform fee', nfts: 'None', stocks: 'None', other: '1.5% p.a.', notes: 'Only on alternative investments.' },
  { type: 'Inactivity fee', nfts: 'None', stocks: 'None', other: 'None', notes: 'No inactivity fees, ever.' },
  { type: 'Custody / storage', nfts: 'Included', stocks: 'Included', other: 'Included', notes: 'Covered in platform fee.' },
];

export default function Pricing() {
  const [calcAmount, setCalcAmount] = useState('1000');
  const [calcType, setCalcType] = useState<'deposit' | 'withdrawal' | 'fx'>('withdrawal');
  const [calcCurrency, setCalcCurrency] = useState('EUR');

  const amt = parseFloat(calcAmount) || 0;
  const fee = calcType === 'deposit' ? 0 : calcType === 'withdrawal' ? amt * 0.004 : amt * 0.006;
  const net = calcType === 'fx' ? (amt - fee) * 0.92 : amt - fee;

  return (
    <div className="bg-[#F7F7F5] min-h-screen">
      <div className="pt-32 pb-16 px-6 bg-[#0A0B0D]">
        <div className="max-w-[1200px] mx-auto text-center">
          <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-4">Transparent pricing</p>
          <h1 className="font-display font-800 text-5xl lg:text-6xl text-white mb-6">No surprises. No hidden fees.</h1>
          <p className="text-white/40 text-base max-w-xl mx-auto">Every fee is shown before you confirm. Here's the full table.</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {/* Fee table */}
        <div className="bg-white rounded-2xl border border-[#0A0B0D]/6 overflow-hidden mb-16">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-[#0A0B0D]/8 bg-[#0A0B0D]">
            {['Fee type', 'NFTs', 'Stocks', 'Other Investments'].map(h => (
              <div key={h} className="px-5 py-4">
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">{h}</span>
              </div>
            ))}
          </div>
          {fees.map((row, i) => (
            <div key={row.type} className={`grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-[#0A0B0D]/5 last:border-0 ${i % 2 === 1 ? 'bg-[#0A0B0D]/2' : ''}`}>
              <div className="px-5 py-4">
                <p className="text-sm font-display font-600 text-[#0A0B0D]">{row.type}</p>
                <p className="text-xs text-[#0A0B0D]/35 mt-0.5 flex items-center gap-1">
                  <Info size={10} /> {row.notes}
                </p>
              </div>
              {[row.nfts, row.stocks, row.other].map((val, j) => (
                <div key={j} className="px-5 py-4 flex items-center">
                  <span className={`font-mono text-sm font-600 ${val === 'Free' || val === 'None' || val === 'Included' ? 'text-[#22C55E]' : 'text-[#0A0B0D]'}`}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* FX Calculator */}
        <div className="bg-[#0A0B0D] rounded-2xl p-8 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#2F6BFF]/15 flex items-center justify-center">
              <Calculator size={18} className="text-[#2F6BFF]" />
            </div>
            <div>
              <h2 className="font-display font-700 text-xl text-white">Fee calculator</h2>
              <p className="text-sm text-white/40">See exactly what you'll pay before you do anything</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs text-white/40 mb-2">Transaction type</label>
              <div className="grid grid-cols-3 gap-1 bg-white/5 rounded-xl p-1">
                {(['deposit', 'withdrawal', 'fx'] as const).map(t => (
                  <button key={t} onClick={() => setCalcType(t)}
                    className={`py-2 rounded-lg text-xs font-medium capitalize transition-all ${calcType === t ? 'bg-[#2F6BFF] text-white' : 'text-white/40 hover:text-white/70'}`}>
                    {t === 'fx' ? 'FX Conversion' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-2">Amount (USD)</label>
              <input type="number" value={calcAmount} onChange={e => setCalcAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-[#2F6BFF] transition-colors" />
            </div>
            {calcType === 'fx' && (
              <div>
                <label className="block text-xs text-white/40 mb-2">To currency</label>
                <select value={calcCurrency} onChange={e => setCalcCurrency(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none cursor-pointer">
                  {['EUR', 'GBP', 'AED'].map(c => <option key={c} className="bg-[#111318]">{c}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Amount</span>
              <span className="font-mono text-white">${amt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Fee</span>
              <span className="font-mono text-white/60">{fee === 0 ? 'Free' : `-$${fee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/10">
              <span className="font-display font-700 text-base text-white">You receive</span>
              <span className="font-mono font-800 text-2xl text-[#22C55E]">
                {calcType === 'fx' ? `${calcCurrency} ${net.toFixed(2)}` : `$${net.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Live FX calculator */}
        <div className="mt-12 max-w-2xl mx-auto">
          <FxCalculator />
        </div>

        {/* Note */}
        <p className="text-xs text-[#0A0B0D]/30 text-center leading-relaxed">
          Fees are indicative and may vary based on market conditions, payment method, and regulatory requirements in your jurisdiction. Always check the fee breakdown shown before confirming any transaction.
        </p>
      </div>
    </div>
  );
}
