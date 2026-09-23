// Mock data for IndySolutions platform

export const mockNFTs = [
  { id: 'nft-1', name: 'Quantum Orchid #042', collection: 'Digital Bloom', price: 4.2, currency: 'ETH', usd: 14700, change: 12.4, image: 'photo-1634193295627-1cdddf751ebf', verified: true, rarity: 'Legendary', traits: [{ trait: 'Background', value: 'Deep Space' }, { trait: 'Style', value: 'Chromatic' }, { trait: 'Edition', value: '1 of 10' }] },
  { id: 'nft-2', name: 'Void Walker #009', collection: 'Neon Genesis', price: 1.8, currency: 'ETH', usd: 6300, change: -3.2, image: 'photo-1618005182384-a83a8bd57fbe', verified: true, rarity: 'Rare', traits: [{ trait: 'Background', value: 'Void' }, { trait: 'Style', value: 'Monochrome' }, { trait: 'Edition', value: '1 of 50' }] },
  { id: 'nft-3', name: 'Solaris Prime', collection: 'CryptoArt', price: 9.5, currency: 'ETH', usd: 33250, change: 28.1, image: 'photo-1558618666-fcd25c85cd64', verified: true, rarity: 'Legendary', traits: [{ trait: 'Background', value: 'Solar Flare' }, { trait: 'Style', value: 'Vivid' }, { trait: 'Edition', value: '1 of 3' }] },
  { id: 'nft-4', name: 'Meridian #117', collection: 'Abstract Futures', price: 0.45, currency: 'ETH', usd: 1575, change: 5.6, image: 'photo-1549317661-bd32c8ce0db2', verified: false, rarity: 'Common', traits: [{ trait: 'Background', value: 'Geometric' }, { trait: 'Edition', value: '1 of 200' }] },
  { id: 'nft-5', name: 'Electric Forest', collection: 'NatureCode', price: 2.1, currency: 'ETH', usd: 7350, change: -1.8, image: 'photo-1500462918059-b1a0cb512f1d', verified: true, rarity: 'Uncommon', traits: [{ trait: 'Background', value: 'Forest' }, { trait: 'Style', value: 'Neon' }] },
  { id: 'nft-6', name: 'Titan Construct #88', collection: 'MechVerse', price: 6.7, currency: 'ETH', usd: 23450, change: 18.3, image: 'photo-1535016120720-40c646be5580', verified: true, rarity: 'Epic', traits: [{ trait: 'Weapon', value: 'Plasma Blade' }, { trait: 'Armor', value: 'Obsidian' }] },
];

export const mockStocks = [
  { id: 'TSLA', name: 'Tesla Inc.', price: 248.52, change: 3.21, changePct: 1.31, volume: '28.4M', cap: '792B', sector: 'EV', sparkline: [220, 225, 218, 235, 242, 238, 248] },
  { id: 'ASTS', name: 'AST SpaceMobile', price: 42.18, change: 1.85, changePct: 4.58, volume: '12.1M', cap: '8.2B', sector: 'Space', sparkline: [35, 37, 40, 38, 41, 40, 42] },
  { id: 'RKLB', name: 'Rocket Lab USA', price: 28.74, change: 0.92, changePct: 3.31, volume: '9.8M', cap: '14.1B', sector: 'Space', sparkline: [24, 26, 25, 27, 27, 28, 28.7] },
  { id: 'SPCE', name: 'Virgin Galactic', price: 3.42, change: -0.18, changePct: -5.0, volume: '5.2M', cap: '0.8B', sector: 'Space', sparkline: [4, 3.8, 3.7, 3.6, 3.5, 3.6, 3.42] },
  { id: 'MSFT', name: 'Microsoft Corp.', price: 415.32, change: 5.14, changePct: 1.25, volume: '18.3M', cap: '3.1T', sector: 'Tech', sparkline: [400, 405, 410, 408, 412, 413, 415] },
  { id: 'NVDA', name: 'NVIDIA Corp.', price: 875.20, change: 22.40, changePct: 2.63, volume: '35.6M', cap: '2.2T', sector: 'AI', sparkline: [820, 835, 850, 845, 860, 870, 875] },
  { id: 'AMZN', name: 'Amazon.com Inc.', price: 188.74, change: -2.30, changePct: -1.21, volume: '22.1M', cap: '1.9T', sector: 'Tech', sparkline: [192, 191, 190, 188, 189, 190, 188.7] },
  { id: 'PLTR', name: 'Palantir Technologies', price: 24.68, change: 0.45, changePct: 1.86, volume: '41.2M', cap: '52.6B', sector: 'AI', sparkline: [23, 23.5, 24, 23.8, 24.2, 24.5, 24.68] },
];

export const spaceStocks = ['ASTS', 'RKLB', 'SPCE'];

// Vehicle-backed investment offerings. Real Tesla lineup specs, pulled from Tesla's
// public spec sheets. Prices move often, update before launch. Fractional exposure is
// structured as vehicle-backed shares (see /vehicles page copy).
export const mockVehicles = [
  {
    id: 'model-3',
    name: 'Model 3',
    tagline: 'The accessible entry point to the EV resale market',
    price: 38990,
    rangeMi: 363,
    zeroToSixty: 4.9,
    topSpeedMph: 125,
    seats: 5,
    image: 'photo-1560958089-b8a1929cea89',
    note: 'Highest resale velocity in the fleet. Best liquidity profile for short-hold allocations.',
  },
  {
    id: 'model-y',
    name: 'Model Y',
    tagline: 'Best-selling SUV in the world, fleet workhorse',
    price: 41490,
    rangeMi: 330,
    zeroToSixty: 4.8,
    topSpeedMph: 135,
    seats: 7,
    image: 'photo-1571068316344-75bc76f77890',
    note: 'Fleet backbone. Strong rental demand keeps utilization above 80% across the pool.',
  },
  {
    id: 'model-s',
    name: 'Model S',
    tagline: 'Long-range flagship for premium allocations',
    price: 87490,
    rangeMi: 410,
    zeroToSixty: 3.1,
    topSpeedMph: 149,
    seats: 5,
    image: 'photo-1617788138017-80ad40651399',
    note: 'Plaid trim vehicles hold collector interest. Slower turnover, higher per-unit margin.',
  },
  {
    id: 'model-x',
    name: 'Model X',
    tagline: 'Full-size SUV with falcon-wing doors',
    price: 92490,
    rangeMi: 335,
    zeroToSixty: 3.8,
    topSpeedMph: 155,
    seats: 7,
    image: 'photo-1553440569-bcc63803a83d',
    note: 'Lowest fleet volume. Limited allocation windows, announced to holders by email first.',
  },
  {
    id: 'cybertruck',
    name: 'Cybertruck',
    tagline: 'Stainless-steel utility with the strongest order backlog',
    price: 82490,
    rangeMi: 340,
    zeroToSixty: 2.6,
    topSpeedMph: 130,
    seats: 5,
    image: 'photo-1617704548623-340376564e68',
    note: 'Waitlist-driven demand. Allocations typically sell out within hours of listing.',
  },
];

export const mockInvestments = [
  { id: 'inv-1', name: 'Manhattan Luxury Tower Fund', category: 'Real Estate', description: 'Fractional ownership in a 42-floor luxury residential tower in Midtown Manhattan. Q4 completion expected with 8.2% projected annual yield.', image: 'photo-1486325212027-8081e485255e', progress: 72, target: 25000000, raised: 18000000, returnMin: 7.8, returnMax: 9.2, timeline: '24 months', verified: true },
  { id: 'inv-2', name: 'Gold Reserve Allocation Series IV', category: 'Commodities', description: 'Allocated physical gold stored in Swiss vaults with allocated storage certificates. LBMA-certified bars, fully insured, quarterly audit reports.', image: 'photo-1610375461369-d613b564f4c4', progress: 94, target: 5000000, raised: 4700000, returnMin: 4.5, returnMax: 6.1, timeline: '12 months', verified: true },
  { id: 'inv-3', name: 'Series B: MedTech AI Platform', category: 'Private Deals', description: 'Pre-IPO equity stake in a medical diagnostics AI company with 3 FDA clearances, 180 hospital partnerships, and projected 2026 IPO.', image: 'photo-1559757148-5c350d0d3c56', progress: 38, target: 8000000, raised: 3040000, returnMin: 15.0, returnMax: 35.0, timeline: '18-36 months', verified: true },
  { id: 'inv-4', name: 'Dubai Marina Commercial REIT', category: 'Real Estate', description: 'UAE-based real estate investment trust covering Grade-A commercial units in Dubai Marina, regulated by DFSA.', image: 'photo-1512453979798-5ea266f8880c', progress: 55, target: 12000000, raised: 6600000, returnMin: 9.0, returnMax: 11.5, timeline: '36 months', verified: true },
  { id: 'inv-5', name: 'Lithium Supply Chain Fund', category: 'Commodities', description: 'Diversified exposure to lithium mining operations in Chile and Australia through a regulated commodity fund. Critical EV supply chain asset.', image: 'photo-1532996122724-e3c354a0b15b', progress: 61, target: 3500000, raised: 2135000, returnMin: 11.0, returnMax: 18.0, timeline: '24 months', verified: false },
];

export const mockTransactions = [
  { id: 'tx-001', type: 'deposit', description: 'Bank Transfer Deposit', asset: 'USD', amount: 10000, direction: 'in', status: 'completed', date: '2026-09-20T14:32:00Z', fee: 0, rate: null },
  { id: 'tx-002', type: 'buy', description: 'Purchased NVDA', asset: 'Stocks', amount: 4376, direction: 'out', status: 'completed', date: '2026-09-19T10:15:00Z', fee: 4.38, rate: null },
  { id: 'tx-003', type: 'buy', description: 'Purchased Quantum Orchid #042', asset: 'NFT', amount: 14700, direction: 'out', status: 'completed', date: '2026-09-18T16:45:00Z', fee: 147, rate: null },
  { id: 'tx-004', type: 'withdrawal', description: 'Withdrawal to Barclays ****4521', asset: 'GBP', amount: 3200, direction: 'out', status: 'pending', date: '2026-09-17T09:00:00Z', fee: 12.80, rate: '1 USD = 0.79 GBP' },
  { id: 'tx-005', type: 'sell', description: 'Sold TSLA', asset: 'Stocks', amount: 1987.60, direction: 'in', status: 'completed', date: '2026-09-15T11:22:00Z', fee: 1.99, rate: null },
  { id: 'tx-006', type: 'deposit', description: 'USDT Deposit (TRC-20)', asset: 'Crypto', amount: 5000, direction: 'in', status: 'completed', date: '2026-09-12T20:10:00Z', fee: 1.00, rate: null },
  { id: 'tx-007', type: 'fee', description: 'Inactivity fee waived', asset: 'USD', amount: 0, direction: 'out', status: 'completed', date: '2026-09-01T00:00:00Z', fee: 0, rate: null },
  { id: 'tx-008', type: 'withdrawal', description: 'Withdrawal to Visa ****8834', asset: 'EUR', amount: 2100, direction: 'out', status: 'failed', date: '2026-08-28T13:50:00Z', fee: 8.40, rate: '1 USD = 0.92 EUR' },
];

export const portfolioChartData = [
  { date: 'Jan', value: 42000 }, { date: 'Feb', value: 45200 }, { date: 'Mar', value: 41800 },
  { date: 'Apr', value: 49600 }, { date: 'May', value: 53200 }, { date: 'Jun', value: 51000 },
  { date: 'Jul', value: 58400 }, { date: 'Aug', value: 62100 }, { date: 'Sep', value: 67850 },
];

export const tickerItems = [
  { symbol: 'NVDA', price: '875.20', change: '+2.63%', positive: true },
  { symbol: 'TSLA', price: '248.52', change: '+1.31%', positive: true },
  { symbol: 'ASTS', price: '42.18', change: '+4.58%', positive: true },
  { symbol: 'ETH/USD', price: '3,500.80', change: '+1.12%', positive: true },
  { symbol: 'BTC/USD', price: '67,240', change: '-0.84%', positive: false },
  { symbol: 'RKLB', price: '28.74', change: '+3.31%', positive: true },
  { symbol: 'PLTR', price: '24.68', change: '+1.86%', positive: true },
  { symbol: 'AMZN', price: '188.74', change: '-1.21%', positive: false },
  { symbol: 'MSFT', price: '415.32', change: '+1.25%', positive: true },
  { symbol: 'SOL/USD', price: '178.40', change: '+3.41%', positive: true },
  { symbol: 'GOLD', price: '2,340/oz', change: '+0.22%', positive: true },
  { symbol: 'SPCE', price: '3.42', change: '-5.00%', positive: false },
];

export const languages = [
  { code: 'en', name: 'English', script: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', script: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', script: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', script: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', script: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', script: 'العربية', flag: '🇦🇪' },
];

export const kycStatuses = {
  verified: { label: 'Verified', color: 'chip-gain' },
  pending: { label: 'Pending Review', color: 'chip-warning' },
  rejected: { label: 'Rejected', color: 'chip-loss' },
  unverified: { label: 'Not Started', color: 'chip-neutral' },
};

export const adminUsers = [
  { id: 'u-001', name: 'Marcus Chen', email: 'marcus@example.com', kyc: 'verified', balance: 67850, signupDate: '2025-03-14', country: 'US' },
  { id: 'u-002', name: 'Amara Osei', email: 'amara@example.com', kyc: 'pending', balance: 12400, signupDate: '2026-07-08', country: 'GH' },
  { id: 'u-003', name: 'Lena Müller', email: 'lena@example.com', kyc: 'verified', balance: 204000, signupDate: '2025-11-22', country: 'DE' },
  { id: 'u-004', name: 'Raj Krishnamurthy', email: 'raj@example.com', kyc: 'rejected', balance: 0, signupDate: '2026-09-01', country: 'IN' },
  { id: 'u-005', name: 'Sofia Andrade', email: 'sofia@example.com', kyc: 'verified', balance: 38600, signupDate: '2026-01-15', country: 'BR' },
];

export const auditLog = [
  { id: 'al-001', admin: 'admin@indysolutions.com', action: 'KYC Approved', target: 'Marcus Chen', before: 'pending', after: 'verified', date: '2026-09-20T10:32:00Z' },
  { id: 'al-002', admin: 'admin@indysolutions.com', action: 'Balance Adjustment', target: 'Lena Müller', before: '$198,000', after: '$204,000', date: '2026-09-19T15:14:00Z' },
  { id: 'al-003', admin: 'super@indysolutions.com', action: 'KYC Rejected', target: 'Raj Krishnamurthy', before: 'pending', after: 'rejected', date: '2026-09-18T09:05:00Z' },
  { id: 'al-004', admin: 'admin@indysolutions.com', action: 'User Email Updated', target: 'Sofia Andrade', before: 'old@example.com', after: 'sofia@example.com', date: '2026-09-17T11:22:00Z' },
  { id: 'al-005', admin: 'super@indysolutions.com', action: 'Withdrawal Approved', target: 'Marcus Chen', before: 'pending', after: 'processing', date: '2026-09-17T09:00:00Z' },
];
