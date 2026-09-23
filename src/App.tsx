import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import SupportWidget from './components/SupportWidget';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import NFTs from './pages/NFTs';
import NFTDetail from './pages/NFTDetail';
import Stocks from './pages/Stocks';
import StockDetail from './pages/StockDetail';
import Vehicles from './pages/Vehicles';
import OtherInvestments from './pages/OtherInvestments';
import InvestmentDetail from './pages/InvestmentDetail';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import TransactionHistory from './pages/TransactionHistory';
import Settings from './pages/Settings';
import HowItWorks from './pages/HowItWorks';
import SecurityTrust from './pages/SecurityTrust';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import SessionExpired from './pages/SessionExpired';
import Maintenance from './pages/Maintenance';
import GenericError from './pages/GenericError';

// Admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminKYC from './pages/admin/AdminKYC';
import AdminSupport from './pages/admin/AdminSupport';
import AdminAudit from './pages/admin/AdminAudit';

const NO_NAV_ROUTES = ['/login', '/signup', '/admin', '/admin/dashboard', '/admin/users', '/admin/kyc', '/admin/support', '/admin/audit', '/session-expired', '/maintenance', '/error'];
const AUTH_ROUTES = ['/dashboard', '/deposit', '/withdraw', '/transactions', '/settings'];
const NO_FOOTER_ROUTES = ['/login', '/signup', '/dashboard', '/deposit', '/withdraw', '/admin'];
const NO_SUPPORT_ROUTES = ['/login', '/signup', '/admin', '/session-expired', '/maintenance', '/error'];

function AppShell() {
  const { pathname } = useLocation();

  const isAdmin = pathname.startsWith('/admin');
  const showNav = !isAdmin && !NO_NAV_ROUTES.some(r => pathname === r);
  const isAuthenticated = AUTH_ROUTES.some(r => pathname.startsWith(r));
  const showFooter = !isAdmin && !NO_FOOTER_ROUTES.some(r => pathname.startsWith(r));
  const showSupport = !NO_SUPPORT_ROUTES.some(r => pathname.startsWith(r)) && isAuthenticated;

  return (
    <>
      {showNav && <Nav isAuthenticated={isAuthenticated} />}

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/nfts" element={<NFTs />} />
        <Route path="/nfts/:id" element={<NFTDetail />} />
        <Route path="/stocks" element={<Stocks />} />
        <Route path="/stocks/:id" element={<StockDetail />} />
        <Route path="/investments" element={<OtherInvestments />} />
        <Route path="/investments/:id" element={<InvestmentDetail />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/security" element={<SecurityTrust />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Authenticated */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/transactions" element={<TransactionHistory />} />
        <Route path="/settings" element={<Settings />} />

        {/* Utility */}
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/error" element={<GenericError />} />
        <Route path="*" element={<NotFound />} />

        {/* Admin (hidden) */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:id" element={<AdminUserDetail />} />
        <Route path="/admin/kyc" element={<AdminKYC />} />
        <Route path="/admin/support" element={<AdminSupport />} />
        <Route path="/admin/audit" element={<AdminAudit />} />
      </Routes>

      {showFooter && <Footer />}
      {showSupport && <SupportWidget />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
