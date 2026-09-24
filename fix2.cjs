const fs = require('fs');

// 1. SupportWidget.tsx
let widget = fs.readFileSync('src/components/SupportWidget.tsx', 'utf8');
widget = widget.replace(/useEffect\(\(\) => \{\n    const openMe = \(\) => setOpen\(true\);\n    window\.addEventListener\('indy-open-support', openMe\);\n    return \(\) => window\.removeEventListener\('indy-open-support', openMe\);\n  \}, \[\]\);/, `useEffect(() => {
    const openMe = () => {
      if (!signedIn) {
        setShowingGate(true);
        setOpen(false);
      } else {
        setOpen(true);
        setShowingGate(false);
      }
    };
    window.addEventListener('indy-open-support', openMe);
    return () => window.removeEventListener('indy-open-support', openMe);
  }, [signedIn]);`);
fs.writeFileSync('src/components/SupportWidget.tsx', widget);

// 2. Create fx feed
fs.writeFileSync('src/lib/fxRates.ts', `export function getFXRate(to: string): number {
  if (to === 'GBP') return 0.79;
  if (to === 'EUR') return 0.92;
  if (to === 'BTC') return 0.000015;
  if (to === 'USD') return 1;
  return 1;
}

export function getFXSymbol(to: string): string {
  if (to === 'GBP') return '£';
  if (to === 'EUR') return '€';
  if (to === 'BTC') return '₿';
  return '$';
}
`);

// 3. Create CurrencyCalculator
fs.writeFileSync('src/components/CurrencyCalculator.tsx', `import { useState, useEffect } from 'react';
import { RefreshCw, ArrowRightLeft } from 'lucide-react';
import { getFXRate } from '../lib/fxRates';

export default function CurrencyCalculator({ compact = false }: { compact?: boolean }) {
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const currencies = ['USD', 'EUR', 'GBP', 'BTC'];

  const amt = parseFloat(amount) || 0;
  // Convert from 'from' to USD, then USD to 'to'
  const inUsd = from === 'USD' ? amt : amt / getFXRate(from);
  const result = to === 'USD' ? inUsd : inUsd * getFXRate(to);
  
  const formattedResult = to === 'BTC' ? result.toFixed(6) : result.toFixed(2);

  return (
    <div className={\`glass rounded-2xl border border-black/8 \${compact ? 'p-4' : 'p-6 md:p-8'}\`}>
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-600 text-xl text-[#0A0B0D]">Live Calculator</h3>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
            <span className="text-xs text-black/40 font-mono">
              Rates as of {lastRefreshed.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
            </span>
            <button onClick={() => setLastRefreshed(new Date())} className="text-black/30 hover:text-black/60"><RefreshCw size={13} /></button>
          </div>
        </div>
      )}
      
      <div className={\`flex \${compact ? 'flex-col gap-3' : 'flex-col md:flex-row items-center gap-4'}\`}>
        <div className="flex-1 w-full bg-white border border-black/10 rounded-xl p-3 flex items-center gap-3">
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent font-mono font-600 text-lg text-[#0A0B0D] outline-none"
          />
          <select 
            value={from} 
            onChange={(e) => setFrom(e.target.value)}
            className="bg-black/5 rounded-lg px-2 py-1 text-sm font-medium outline-none"
          >
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <div className={\`flex justify-center \${compact ? '' : 'px-2'}\`}>
          <button 
            onClick={() => { setFrom(to); setTo(from); }}
            className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
          >
            <ArrowRightLeft size={14} className="text-black/40" />
          </button>
        </div>

        <div className="flex-1 w-full bg-black/3 border border-black/8 rounded-xl p-3 flex items-center gap-3">
          <div className="flex-1 font-mono font-600 text-lg text-[#0A0B0D] truncate">
            {formattedResult}
          </div>
          <select 
            value={to} 
            onChange={(e) => setTo(e.target.value)}
            className="bg-white rounded-lg border border-black/10 px-2 py-1 text-sm font-medium outline-none"
          >
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
`);
