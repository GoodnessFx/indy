import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';
import AssetImage from '../components/AssetImage';

const steps = [
  {
    n: '01', title: 'Create your account', image: 'photo-1614854262318-831574f15f1f',
    body: 'Sign up with your email or Google/Apple SSO. Your account exists in under two minutes, and you can browse the whole platform before you verify anything.',
    long: [
      'When you sign up we create a user record with your name, email, and country, then email you a verification link. Until you click it, the account stays inactive.',
      'If you use Google or Apple, the login is handled by that provider and we only receive your name and email address. We never see or store your Google password, and we never touch your Apple credentials.',
      'Every successful login is written to a login history you can review in Settings under Security. If we see a sign in from a new device, we send you an alert.',
      'Repeated failed sign in attempts are rate limited. After five failures from the same account or address in a rolling window, the session locks and requires a password reset.',
    ],
    details: ['Email or SSO in under two minutes', 'No minimum investment required', 'Available in 6 languages', 'Full login history you can review'],
  },
  {
    n: '02', title: 'Complete identity verification', image: 'photo-1454165804606-c3d57bc86b40',
    body: 'Upload a government issued ID and we check it against sanction and watchlist databases. Regulation requires this, and it usually clears the same day.',
    long: [
      'Verification satisfies anti money laundering law in every country we operate in. It also protects you, because funds can only be withdrawn to an account in your own name.',
      'You upload a passport, driver license, or national ID. Documents are encrypted at rest with AES-256, stored in a private bucket, and deleted once the legal retention window expires.',
      'An automated provider reads the document, checks it for tampering, and compares your selfie to the portrait. Clear cases finish in minutes. Anything unusual goes to a human reviewer on our compliance team.',
      'Your status is always visible in Settings under Verification. You see one of four states, unverified, pending, verified, or rejected. A rejection always states the specific reason and lets you re upload without starting over.',
    ],
    details: ['Passport, driver license, or national ID', 'Automated document and liveness check', 'Usually reviewed within 24 hours', 'Rejection reasons shown, with re upload'],
  },
  {
    n: '03', title: 'Fund your account', image: 'photo-1563013544-824ae1b704d3',
    body: 'Deposit by bank transfer, card, or crypto. Card deposits credit instantly, bank transfers and crypto credit as soon as they confirm.',
    long: [
      'Bank transfers are settled by a licensed payment partner, not by us directly. We show you their receiving details and a reference code. Always include that code, it is how your deposit is matched to your account. Without it the transfer goes to manual review and can take days to trace.',
      'Card payments are tokenized by the processor. The card number goes straight into their vault and never reaches our servers or our database. We keep only the last four digits so you recognize the card in your settings.',
      'Crypto deposits are matched on chain. Check the network before you send, because USDT sent on the wrong network cannot be recovered by anyone, including us.',
      'Once a deposit confirms, the balance posts to your ledger and you receive a notification. Transaction history keeps the full record, the reference, the method, and the exact time it cleared.',
    ],
    details: ['Bank transfer, card, or crypto', 'Card deposits credit instantly', 'Processor vaults card numbers, never us', 'Every deposit receipted in transaction history'],
  },
  {
    n: '04', title: 'Invest across three asset classes', image: 'photo-1611974789855-9c2a0a7236a3',
    body: 'Browse verified NFTs, live equity markets, and curated alternative deals from one portfolio view. Buy, hold, and track everything in a single ledger.',
    long: [
      'Stock prices come from a market data provider and refresh on a short cache, usually every fifteen to thirty seconds. The page shows the time the price was captured, so you can tell a live quote from a cached one.',
      'NFT listings carry a verification badge once ownership and collection data are checked. Traits, editions, and price history sit on the asset page so you are not buying on a thumbnail alone.',
      'Alternative investments move slowly by design. Every deal page states the funding target, projected return range, maturity timeline, and structure, and the funding bar updates as commitments come in.',
      'Every buy and sell writes an immutable transaction row with the price you executed at. Your portfolio total is the sum of current positions at the latest price, not a number we type in by hand.',
    ],
    details: ['Prices stamped with capture time', 'Verification badge on every checked NFT', 'Deal pages state structure and timeline', 'Executed price recorded on every trade'],
  },
  {
    n: '05', title: 'Withdraw to your own currency', image: 'photo-1526304640581-d334cdbbf45e',
    body: 'See the fee, the tax withholding estimate, and the locked exchange rate before you confirm. Nothing is deducted silently.',
    long: [
      'The breakdown appears before you confirm, never after. You see the amount requested, the exchange rate with the time it was locked, the estimated tax withholding labeled as an estimate, the service fee, and the exact net amount landing in your account.',
      'Indy acts as the routing layer. Your payout is executed by a licensed partner to the bank account or card you linked, and we keep only their confirmation reference. Full account numbers are never stored on our side.',
      'Bank payouts typically land in one to three business days. Card payouts are usually same day. Every status change, pending, processing, completed, is visible in your transaction history.',
      'If a payout fails we do not leave you guessing. The withdrawal record shows the processor reason, and support opens a ticket with the reference already attached.',
    ],
    details: ['Fees and rate shown before confirmation', 'Rate locked the moment you confirm', 'Routed by a licensed payout partner', 'Full status trail in transaction history'],
  },
];

const firstQuestions = [
  {
    q: 'Is my money safe?',
    a: 'Client funds sit in segregated accounts with our licensed banking partner, separate from company operating money. Card numbers are vaulted by the processor and never stored on our servers. Every admin action on a user record, including any balance adjustment, is written to an audit log with a reason attached.',
  },
  {
    q: 'How fast is a withdrawal?',
    a: 'Card payouts usually complete the same day, often within hours. Bank payouts take one to three business days depending on the receiving bank and the currency. The estimate on your confirmation screen is the same one our operations team works from.',
  },
  {
    q: 'What if I lose access to my account?',
    a: 'Use Forgot password on the sign in screen to reset through your verified email. If you have also lost that email or your two factor device, support can restore access after an identity check against your verified documents. Funds can only ever go to a payout method in your own name.',
  },
  {
    q: 'How are fees calculated?',
    a: 'Fees are a percentage of the transaction with a stated minimum, itemized on screen before you confirm anything. Currency conversion uses the mid market rate plus a disclosed spread. You can model any amount with the calculator on the Pricing page.',
  },
];

const faqs = [
  { q: 'Is IndySolutions regulated?', a: 'IndySolutions operates under applicable financial regulations in each jurisdiction it serves. Payment processing is handled by licensed, PCI-DSS compliant partners. Full regulatory detail lives on our Security and Trust page.' },
  { q: 'What are the minimum investments?', a: 'There is no minimum for stock trading. NFT purchases are at market price. Alternative investment minimums vary by deal, and most start at $1,000.' },
  { q: 'How are my assets held?', a: 'Stocks are held in your name through our regulated custody partner. NFTs sit in a custodial wallet on your behalf. Alternative investments are held according to the terms of each deal structure, which are published on the deal page.' },
  { q: 'Can I use IndySolutions from any country?', a: 'IndySolutions is live in 68 countries. Some features are limited by local rules, and when that applies to your country you see it clearly at signup rather than discovering it at withdrawal.' },
  { q: 'How is the exchange rate decided?', a: 'We take the mid market rate from institutional feeds and add a small disclosed spread. The exact rate and the time it was locked appear on your confirmation screen and are stored on the withdrawal record.' },
  { q: 'Can I cancel a withdrawal?', a: 'Yes, while it is still pending. Once it moves to processing the payout has been handed to the partner network and can no longer be pulled back, which is exactly why the status is visible at every step.' },
  { q: 'Are there inactivity fees?', a: 'No. Holding a position costs nothing. You pay when you transact, convert currency, or withdraw, and never simply for having an account.' },
  { q: 'Do you sell my data?', a: 'No. We share data only with the partners required to verify your identity, move your money, and run the platform, and only what each of them needs. We do not sell it to anyone.' },
  { q: 'What happens if I close my account?', a: 'You sell or transfer positions, withdraw the balance, then close. The Danger zone in Settings handles closing and lets you download a full copy of your data before anything is removed.' },
];

export default function HowItWorks() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="bg-[#F7F7F5]">
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-[#F7F7F5]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-4">Process</p>
          <h1 className="font-display font-800 text-5xl lg:text-7xl text-[#0A0B0D] leading-tight mb-6">
            How IndySolutions works
          </h1>
          <p className="text-black/40 text-lg leading-relaxed">
            From account creation to your first investment, every step, explained clearly.
          </p>
        </div>
      </section>

      {/* Steps, full viewport sections */}
      {steps.map((step, i) => (
        <section key={step.n} className={`py-28 px-6 ${i % 2 === 0 ? 'bg-[#F7F7F5]' : 'bg-[#F7F7F5]'}`}>
          <div className="max-w-[1200px] mx-auto">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${i % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
              <div className={i % 2 === 1 ? 'lg:col-start-2' : ''}>
                <span className={`font-mono font-700 text-6xl ${i % 2 === 0 ? 'text-[#0A0B0D]/10' : 'text-black/10'}`}>{step.n}</span>
                <h2 className={`font-display font-800 text-4xl lg:text-5xl leading-tight mb-6 -mt-2 ${i % 2 === 0 ? 'text-[#0A0B0D]' : 'text-[#0A0B0D]'}`}>
                  {step.title}
                </h2>
                <p className={`text-base leading-relaxed mb-6 ${i % 2 === 0 ? 'text-[#0A0B0D]/50' : 'text-black/50'}`}>
                  {step.body}
                </p>
                <div className="space-y-4 mb-8">
                  {step.long.map(para => (
                    <p key={para} className="text-sm text-black/45 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
                <ul className="space-y-3">
                  {step.details.map(d => (
                    <li key={d} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#2F6BFF]/15 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-[#2F6BFF]" />
                      </div>
                      <span className={`text-sm ${i % 2 === 0 ? 'text-[#0A0B0D]/60' : 'text-black/60'}`}>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`relative rounded-3xl overflow-hidden ${i % 2 === 1 ? 'lg:col-start-1' : ''}`} style={{ minHeight: '360px' }}>
                <AssetImage
                  seed={step.image}
                  label={step.title}
                  className="absolute inset-0 w-full h-full"
                />
                <div className={`absolute inset-0 ${i % 2 === 0 ? 'bg-gradient-to-br from-transparent to-white/20' : 'bg-gradient-to-br from-transparent to-[#2F6BFF]/20'}`} />
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Straight answers to first time questions */}
      <section className="py-24 px-6 bg-white border-y border-black/5">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="font-mono text-xs text-[#2F6BFF] tracking-widest uppercase mb-4">Straight answers</p>
            <h2 className="font-display font-800 text-4xl lg:text-5xl text-[#0A0B0D] leading-tight mb-4">
              The four things everyone asks first
            </h2>
            <p className="text-black/45 leading-relaxed">
              No hedging on these. If the answer were worse than this, you would read it here first.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {firstQuestions.map(item => (
              <div key={item.q} className="rounded-3xl border border-black/8 bg-[#F7F7F5] p-7">
                <h3 className="font-display font-700 text-lg text-[#0A0B0D] mb-3">{item.q}</h3>
                <p className="text-sm text-black/50 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-[#F7F7F5]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-800 text-4xl text-[#0A0B0D] text-center mb-12">Frequently asked</h2>
          <div className="space-y-2">
            {faqs.map(faq => (
              <div key={faq.q} className="border border-[#0A0B0D]/8 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === faq.q ? null : faq.q)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-display font-600 text-sm text-[#0A0B0D]">{faq.q}</span>
                  <ChevronDown size={16} className={`text-[#0A0B0D]/40 transition-transform shrink-0 ml-4 ${openFaq === faq.q ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === faq.q && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-[#0A0B0D]/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/signup" className="btn-primary px-8 py-4 rounded-xl text-base inline-flex items-center gap-2">
              Get started now <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
