const fs = require('fs');

let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');

if (!home.includes('import CurrencyCalculator')) {
  home = home.replace(/import \{ Link \} from 'react-router-dom';/, "import { Link } from 'react-router-dom';\nimport CurrencyCalculator from '../components/CurrencyCalculator';");
}

const targetStr = '<section className="bg-[#F7F7F5] py-24 px-6">';
const replacement = `<section className="bg-[#0A0B0D] py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="font-mono text-xs text-[#7DA6FF] tracking-widest uppercase mb-3">Live Conversions</p>
            <h2 className="font-display font-700 text-3xl lg:text-4xl text-white">Currency & Crypto Calculator</h2>
          </div>
          <CurrencyCalculator />
        </div>
      </section>

      ` + targetStr;

if (!home.includes('Currency & Crypto Calculator')) {
  home = home.replace(targetStr, replacement);
}

fs.writeFileSync('src/pages/Home.tsx', home);

let dash = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
if (!dash.includes('import CurrencyCalculator')) {
  dash = dash.replace(/import \{ Link \} from 'react-router-dom';/, "import { Link } from 'react-router-dom';\nimport CurrencyCalculator from '../components/CurrencyCalculator';");
}

const dashReplacement = `<div className="glass rounded-2xl border border-black/8 p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs text-black/40 font-mono mb-1">Quick Conversion</p>
              <h2 className="font-display font-600 text-lg text-[#0A0B0D] mb-4">Calculator</h2>
              <CurrencyCalculator compact />
            </div>
          </div>
`;
if (!dash.includes('<CurrencyCalculator compact />')) {
  dash = dash.replace(/<div className="glass rounded-2xl border border-black\/8 p-6 flex flex-col justify-between">\s*<div>\s*<p className="text-xs text-black\/40 font-mono mb-1">Available Cash<\/p>[\s\S]*?Withdraw funds <ArrowUpRight size=\{14\} \/>\s*<\/Link>\s*<\/div>\s*<\/div>/, dashReplacement + '\n          $&');
}

fs.writeFileSync('src/pages/Dashboard.tsx', dash);
