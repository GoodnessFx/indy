import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Globe, ExternalLink } from 'lucide-react';
import Logo from '../components/Logo';


export default function Footer() {
  const [dotClicks, setDotClicks] = useState(0);
  const navigate = useNavigate();

  const handleDotClick = () => {
    const next = dotClicks + 1;
    setDotClicks(next);
    if (next >= 4) {
      setDotClicks(0);
      navigate('/admin');
    }
  };

  return (
    <footer className="bg-[#F7F7F5] border-t border-black/5">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <Logo size={36} />
              <span className="font-display font-700 text-lg text-[#0A0B0D]">
                Indy <span className="text-[#2F6BFF]">Digital Marketing Solutions</span>
              </span>
            </Link>
            <p className="text-sm text-black/40 leading-relaxed max-w-xs mb-6">
              One account. Three asset classes. A single, engineered platform for the modern investor.
            </p>
            <div className="flex items-center gap-3 mb-8">
              {[ExternalLink, ExternalLink, ExternalLink, ExternalLink].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center text-black/40 hover:text-black hover:bg-black/10 transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-black/30" />
              <span className="text-xs text-black/30">Available in 6 languages</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-600 text-sm text-[#0A0B0D] mb-5">Product</h4>
            <ul className="space-y-3">
              {[
                { label: 'NFT Marketplace', to: '/nfts' },
                { label: 'Stock Trading', to: '/stocks' },
                { label: 'Investments', to: '/investments' },
                { label: 'Vehicles', to: '/vehicles' },
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Pricing & Fees', to: '/pricing' },
              ].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-black/40 hover:text-black transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-600 text-sm text-[#0A0B0D] mb-5">Company</h4>
            <ul className="space-y-3">
              {[
                { label: 'About Us', to: '/about' },
                { label: 'How It Works', to: '/how-it-works' },
                { label: 'Security & Trust', to: '/security' },
                { label: 'Contact', to: '/contact' },
                { label: 'Careers', to: '/about#careers' },
              ].map(item => (
                <li key={item.to}>
                  <Link to={item.to} className="text-sm text-black/40 hover:text-black transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Support */}
          <div>
            <h4 className="font-display font-600 text-sm text-[#0A0B0D] mb-5">Support & Legal</h4>
            <ul className="space-y-3">
              {[
                { label: 'Help Center', to: '/contact' },
                { label: 'Live Support', to: '/contact#chat' },
                { label: 'Privacy Policy', to: '/contact' },
                { label: 'Terms of Service', to: '/contact' },
                { label: 'Cookie Policy', to: '/contact' },
              ].map(item => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-black/40 hover:text-black transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-black/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-xs text-black/25">© 2026 Indy Digital Marketing Solutions Ltd. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] dot-pulse" />
              <span className="text-xs text-black/25">All systems operational</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-xs text-black/20">Regulated by FCA, DFSA, SEC registered</p>
            {/* Hidden admin trigger */}
            <button
              onClick={handleDotClick}
              className="w-2 h-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
              title=""
              aria-hidden="true"
            />
          </div>
        </div>

        <p className="mt-6 text-[11px] text-black/15 leading-relaxed max-w-3xl">
          Investment involves risk. The value of investments and the income from them can go down as well as up, and you may not get back the amount originally invested. Indy Digital Marketing Solutions is not a licensed financial advisor. Past performance is not indicative of future results. All trades are subject to our Terms of Service and applicable regulations.
        </p>
      </div>
    </footer>
  );
}
