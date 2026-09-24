// Catalog expansion module.
// Combines the hand written seed records in mock.ts with generated catalogs that
// stay deterministic across reloads. Every generated record varies in name,
// collection, price, traits, and category, so nothing is a renamed duplicate.

import { mockNFTs, mockStocks, mockInvestments } from './mock';

export interface NFTItem {
  id: string;
  name: string;
  collection: string;
  price: number;
  currency: string;
  usd: number;
  change: number;
  image: string;
  verified: boolean;
  rarity: string;
  traits: { trait: string; value: string }[];
}

export interface StockItem {
  id: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  cap: string;
  sector: string;
  sparkline: number[];
}

export interface InvestmentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  progress: number;
  target: number;
  raised: number;
  returnMin: number;
  returnMax: number;
  timeline: string;
  verified: boolean;
}

// Stable pseudo random in [0,1) from an integer seed.
function seed(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const pick = <T,>(arr: T[], n: number) => arr[Math.floor(seed(n) * arr.length) % arr.length];

// --- NFTs: twelve collections, eighteen pieces each, plus the seed pieces ---

const artImages = [
  'art-tide', 'art-ember',
  'art-iris', 'art-halo',
  'art-dune', 'art-reef',
  'art-orchid', 'art-cosmos',
  'art-solar', 'art-mono',
  'art-forest', 'art-morph',
];

const collections = [
  { name: 'Chromatic Drift', style: 'Generative', floor: 0.4 },
  { name: 'Obsidian Protocol', style: '3D Render', floor: 1.1 },
  { name: 'Solar Requiem', style: 'Photographic', floor: 2.4 },
  { name: 'Null Atlas', style: 'Vector', floor: 0.7 },
  { name: 'Pale Machinery', style: 'Industrial', floor: 1.6 },
  { name: 'Tidal Cipher', style: 'Generative', floor: 0.9 },
  { name: 'Aurum Vault', style: 'Metallic', floor: 3.2 },
  { name: 'Static Garden', style: 'Botanical', floor: 0.5 },
  { name: 'Ion Frontier', style: 'Sci-fi', floor: 1.9 },
  { name: 'Lucid Archive', style: 'Collage', floor: 0.8 },
  { name: 'Monolith Nine', style: 'Architectural', floor: 2.1 },
  { name: 'Hollow Meridian', style: 'Abstract', floor: 1.3 },
];

const adjectives = ['Silent', 'Radiant', 'Cobalt', 'Fractured', 'Northern', 'Thermal', 'Velvet', 'Kinetic', 'Opaline', 'Carbon', 'Distant', 'Amber', 'Crimson', 'Vapour', 'Iron', 'Halcyon', 'Neon', 'Umbral'];
const nouns = ['Meridian', 'Canopy', 'Signal', 'Vertex', 'Lattice', 'Prism', 'Drifter', 'Harbour', 'Furnace', 'Monolith', 'Cascade', 'Aperture', 'Beacon', 'Sable', 'Quarry', 'Relic', 'Cinder', 'Vessel'];
const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const palettes = ['Deep Space', 'Solar Flare', 'Obsidian', 'Ion Blue', 'Coral Ash', 'Glacier', 'Ember', 'Void'];
const finishes = ['Matte', 'Chromatic', 'Metallic', 'Holographic', 'Grain', 'Polished'];

function buildNFTs(): NFTItem[] {
  const out: NFTItem[] = [];
  let s = 7;
  collections.forEach((col, ci) => {
    for (let i = 0; i < 18; i++) {
      s += 13;
      const adj = pick(adjectives, s + i * 3);
      const noun = pick(nouns, s + i * 7);
      const edition = 1 + Math.floor(seed(s + i * 11) * 300);
      const rarity = rarities[Math.min(4, Math.floor(seed(s + i * 5) * 5))];
      const price = Number((col.floor + seed(s + i * 17) * col.floor * 2.6).toFixed(2));
      const change = Number((seed(s + i * 23) * 46 - 14).toFixed(1));
      out.push({
        id: `nft-${col.name.toLowerCase().replace(/[^a-z]/g, '')}-${i + 1}`,
        name: `${adj} ${noun} #${String(edition).padStart(3, '0')}`,
        collection: col.name,
        price,
        currency: 'ETH',
        usd: Math.round(price * 3500),
        change,
        image: artImages[(ci * 18 + i) % artImages.length],
        verified: seed(s + i * 29) > 0.22,
        rarity,
        traits: [
          { trait: 'Palette', value: pick(palettes, s + i * 31) },
          { trait: 'Finish', value: pick(finishes, s + i * 37) },
          { trait: 'Style', value: col.style },
          { trait: 'Edition', value: `${edition} of ${edition + 10 + Math.floor(seed(s + i) * 190)}` },
        ],
      });
    }
  });
  return out;
}

export const generatedNFTs = buildNFTs();

export const allNFTs: NFTItem[] = [...(mockNFTs as NFTItem[]), ...generatedNFTs];

export const nftCollections = [
  'All',
  ...collections.map(c => c.name),
  'Digital Bloom', 'Neon Genesis', 'CryptoArt', 'Abstract Futures', 'NatureCode', 'MechVerse',
];

// --- Stocks: 100+ real tickers across sector groups ---
// Live pricing is not wired here. These are static seed values with generated
// sparklines. Swapping in a market data provider means replacing this array's
// price, change, and sparkline fields with a cached API response.

type StockSeed = [id: string, name: string, sector: string, price: number, changePct: number, cap: string];

const stockSeeds: StockSeed[] = [
  ['AAPL', 'Apple Inc.', 'Technology', 214.32, 0.84, '3.3T'],
  ['MSFT', 'Microsoft Corp.', 'Technology', 415.32, 1.25, '3.1T'],
  ['NVDA', 'NVIDIA Corp.', 'Semiconductors', 875.2, 2.63, '2.2T'],
  ['AMD', 'Advanced Micro Devices', 'Semiconductors', 162.44, -1.12, '263B'],
  ['INTC', 'Intel Corp.', 'Semiconductors', 31.2, -0.72, '133B'],
  ['AVGO', 'Broadcom Inc.', 'Semiconductors', 172.85, 2.11, '805B'],
  ['TSM', 'Taiwan Semiconductor', 'Semiconductors', 171.4, 1.48, '889B'],
  ['QCOM', 'Qualcomm Inc.', 'Semiconductors', 178.9, 0.62, '199B'],
  ['MU', 'Micron Technology', 'Semiconductors', 118.24, 3.42, '131B'],
  ['ASML', 'ASML Holding', 'Semiconductors', 892.6, -1.85, '352B'],
  ['ARM', 'Arm Holdings', 'Semiconductors', 138.5, 4.12, '145B'],
  ['SMCI', 'Super Micro Computer', 'Technology', 812.4, -2.3, '48B'],
  ['DELL', 'Dell Technologies', 'Technology', 118.7, 1.02, '84B'],
  ['HPQ', 'HP Inc.', 'Technology', 33.4, -0.4, '32B'],
  ['CRM', 'Salesforce Inc.', 'Software', 262.1, 0.95, '254B'],
  ['ORCL', 'Oracle Corp.', 'Software', 142.6, 1.74, '392B'],
  ['ADBE', 'Adobe Inc.', 'Software', 512.8, -0.88, '228B'],
  ['NOW', 'ServiceNow Inc.', 'Software', 782.4, 1.31, '161B'],
  ['SNOW', 'Snowflake Inc.', 'Software', 142.3, -1.42, '47B'],
  ['PLTR', 'Palantir Technologies', 'Software', 24.68, 1.86, '52.6B'],
  ['UBER', 'Uber Technologies', 'Technology', 72.4, 0.72, '150B'],
  ['SHOP', 'Shopify Inc.', 'Technology', 68.2, 2.04, '88B'],
  ['SQ', 'Block Inc.', 'Fintech', 68.9, -0.6, '42B'],
  ['PYPL', 'PayPal Holdings', 'Fintech', 62.4, 1.18, '66B'],
  ['COIN', 'Coinbase Global', 'Fintech', 214.7, 3.88, '53B'],
  ['HOOD', 'Robinhood Markets', 'Fintech', 22.1, 2.4, '19B'],
  ['SOFI', 'SoFi Technologies', 'Fintech', 8.42, -1.1, '9B'],
  ['RKLB', 'Rocket Lab USA', 'Space', 28.74, 3.31, '14.1B'],
  ['ASTS', 'AST SpaceMobile', 'Space', 42.18, 4.58, '8.2B'],
  ['SPCE', 'Virgin Galactic', 'Space', 3.42, -5.0, '0.8B'],
  ['LUNR', 'Intuitive Machines', 'Space', 6.18, 6.42, '0.9B'],
  ['RDW', 'Redwire Corp.', 'Space', 5.42, 2.18, '0.7B'],
  ['PL', 'Planet Labs', 'Space', 2.28, -1.72, '0.7B'],
  ['IRDM', 'Iridium Communications', 'Space', 28.4, 0.74, '3.4B'],
  ['GSAT', 'Globalstar Inc.', 'Space', 1.32, 2.32, '2.5B'],
  ['VSAT', 'Viasat Inc.', 'Space', 18.6, -0.92, '2.3B'],
  ['BA', 'Boeing Co.', 'Aerospace', 178.4, 0.42, '109B'],
  ['LMT', 'Lockheed Martin', 'Aerospace', 462.8, 0.28, '111B'],
  ['RTX', 'RTX Corp.', 'Aerospace', 102.4, 0.62, '136B'],
  ['NOC', 'Northrop Grumman', 'Aerospace', 478.2, -0.34, '71B'],
  ['GD', 'General Dynamics', 'Aerospace', 288.6, 0.48, '79B'],
  ['HWM', 'Howmet Aerospace', 'Aerospace', 68.4, 1.12, '28B'],
  ['TDG', 'TransDigm Group', 'Aerospace', 1248.0, 0.86, '69B'],
  ['HEI', 'HEICO Corp.', 'Aerospace', 214.6, 1.04, '26B'],
  ['TSLA', 'Tesla Inc.', 'EV', 248.52, 1.31, '792B'],
  ['RIVN', 'Rivian Automotive', 'EV', 14.28, -2.16, '14B'],
  ['LCID', 'Lucid Group', 'EV', 3.12, -1.9, '7B'],
  ['NIO', 'NIO Inc.', 'EV', 5.42, 1.68, '11B'],
  ['XPEV', 'XPeng Inc.', 'EV', 8.74, 2.42, '8B'],
  ['LI', 'Li Auto Inc.', 'EV', 21.4, -0.84, '22B'],
  ['GM', 'General Motors', 'EV', 44.2, 0.52, '50B'],
  ['F', 'Ford Motor Co.', 'EV', 11.24, -0.38, '45B'],
  ['TM', 'Toyota Motor', 'EV', 182.4, 0.44, '248B'],
  ['ENPH', 'Enphase Energy', 'Clean Energy', 118.6, -3.24, '16B'],
  ['FSLR', 'First Solar', 'Clean Energy', 214.8, 2.16, '23B'],
  ['PLUG', 'Plug Power', 'Clean Energy', 2.86, -4.12, '1.7B'],
  ['XOM', 'Exxon Mobil', 'Energy', 114.2, 0.34, '452B'],
  ['CVX', 'Chevron Corp.', 'Energy', 158.4, 0.22, '292B'],
  ['COP', 'ConocoPhillips', 'Energy', 112.6, -0.44, '133B'],
  ['SLB', 'SLB', 'Energy', 48.2, 0.86, '68B'],
  ['OXY', 'Occidental Petroleum', 'Energy', 62.4, -0.62, '58B'],
  ['FCX', 'Freeport-McMoRan', 'Materials', 48.6, 1.24, '70B'],
  ['NEM', 'Newmont Corp.', 'Materials', 42.8, 1.86, '49B'],
  ['ALB', 'Albemarle Corp.', 'Materials', 92.4, -2.42, '11B'],
  ['LIN', 'Linde plc', 'Materials', 438.2, 0.36, '211B'],
  ['CLF', 'Cleveland-Cliffs', 'Materials', 14.2, -1.28, '7B'],
  ['JPM', 'JPMorgan Chase', 'Financials', 208.4, 0.56, '598B'],
  ['BAC', 'Bank of America', 'Financials', 38.4, 0.42, '303B'],
  ['GS', 'Goldman Sachs', 'Financials', 462.8, 1.02, '152B'],
  ['MS', 'Morgan Stanley', 'Financials', 96.2, 0.68, '157B'],
  ['WFC', 'Wells Fargo', 'Financials', 58.4, -0.24, '203B'],
  ['C', 'Citigroup Inc.', 'Financials', 62.1, 0.34, '119B'],
  ['BLK', 'BlackRock Inc.', 'Financials', 812.4, 0.88, '121B'],
  ['V', 'Visa Inc.', 'Financials', 274.6, 0.44, '558B'],
  ['MA', 'Mastercard Inc.', 'Financials', 452.8, 0.62, '421B'],
  ['UNH', 'UnitedHealth Group', 'Healthcare', 512.4, -0.62, '472B'],
  ['JNJ', 'Johnson & Johnson', 'Healthcare', 158.2, 0.22, '381B'],
  ['LLY', 'Eli Lilly', 'Healthcare', 782.4, 1.42, '743B'],
  ['PFE', 'Pfizer Inc.', 'Healthcare', 28.4, -0.48, '161B'],
  ['MRK', 'Merck & Co.', 'Healthcare', 124.6, 0.34, '315B'],
  ['ABBV', 'AbbVie Inc.', 'Healthcare', 178.2, 0.56, '315B'],
  ['TMO', 'Thermo Fisher Scientific', 'Healthcare', 582.4, -0.32, '222B'],
  ['ISRG', 'Intuitive Surgical', 'Healthcare', 412.8, 0.74, '146B'],
  ['VRTX', 'Vertex Pharmaceuticals', 'Healthcare', 442.6, 0.92, '114B'],
  ['MRNA', 'Moderna Inc.', 'Healthcare', 118.4, -2.24, '45B'],
  ['AMZN', 'Amazon.com Inc.', 'Consumer', 188.74, -1.21, '1.9T'],
  ['GOOGL', 'Alphabet Inc.', 'Consumer', 178.4, 0.92, '2.2T'],
  ['META', 'Meta Platforms', 'Consumer', 512.6, 1.44, '1.3T'],
  ['WMT', 'Walmart Inc.', 'Consumer', 68.4, 0.42, '550B'],
  ['COST', 'Costco Wholesale', 'Consumer', 842.6, 0.62, '373B'],
  ['TGT', 'Target Corp.', 'Consumer', 148.2, -0.84, '68B'],
  ['NKE', 'Nike Inc.', 'Consumer', 92.4, -1.12, '138B'],
  ['SBUX', 'Starbucks Corp.', 'Consumer', 94.6, 0.38, '107B'],
  ['MCD', 'McDonald\'s Corp.', 'Consumer', 282.4, 0.24, '203B'],
  ['KO', 'Coca-Cola Co.', 'Consumer', 62.8, 0.18, '270B'],
  ['PEP', 'PepsiCo Inc.', 'Consumer', 172.4, -0.22, '237B'],
  ['DIS', 'Walt Disney Co.', 'Consumer', 98.6, 0.86, '179B'],
  ['NFLX', 'Netflix Inc.', 'Consumer', 682.4, 1.62, '293B'],
  ['SPOT', 'Spotify Technology', 'Consumer', 312.8, 2.14, '61B'],
  ['CAT', 'Caterpillar Inc.', 'Industrial', 342.6, 0.44, '167B'],
  ['DE', 'Deere & Co.', 'Industrial', 382.4, -0.52, '105B'],
  ['HON', 'Honeywell International', 'Industrial', 208.4, 0.36, '136B'],
  ['GE', 'GE Aerospace', 'Industrial', 162.8, 1.18, '176B'],
  ['MMM', '3M Co.', 'Industrial', 102.6, 0.28, '57B'],
  ['UPS', 'United Parcel Service', 'Industrial', 142.4, -0.72, '121B'],
  ['FDX', 'FedEx Corp.', 'Industrial', 262.8, 0.64, '65B'],
  ['UNP', 'Union Pacific', 'Industrial', 242.6, 0.32, '148B'],
  ['NEE', 'NextEra Energy', 'Utilities', 72.4, 0.46, '148B'],
  ['DUK', 'Duke Energy', 'Utilities', 102.8, 0.22, '79B'],
  ['SPY', 'SPDR S&P 500 ETF', 'ETF', 542.6, 0.42, '534B'],
  ['QQQ', 'Invesco QQQ Trust', 'ETF', 462.8, 0.86, '287B'],
  ['VTI', 'Vanguard Total Stock Market', 'ETF', 268.4, 0.38, '412B'],
  ['ARKX', 'ARK Space Exploration ETF', 'ETF', 18.4, 1.86, '0.3B'],
  ['ITA', 'iShares Aerospace & Defense ETF', 'ETF', 132.6, 0.54, '5.2B'],
  ['UFO', 'Procure Space ETF', 'ETF', 19.8, 2.14, '0.02B'],
  ['ICLN', 'iShares Global Clean Energy ETF', 'ETF', 14.2, -0.86, '2.4B'],
  ['GLD', 'SPDR Gold Shares', 'ETF', 214.8, 0.26, '64B'],
  ['SLV', 'iShares Silver Trust', 'ETF', 26.4, 0.62, '13B'],
  ['VNQ', 'Vanguard Real Estate ETF', 'ETF', 88.6, -0.44, '32B'],
];

function sparklineFrom(price: number, seedN: number): number[] {
  const out: number[] = [];
  let v = price * (0.94 + seed(seedN) * 0.05);
  for (let i = 0; i < 7; i++) {
    v = v * (0.988 + seed(seedN + i * 9) * 0.028);
    out.push(Number(v.toFixed(2)));
  }
  out[out.length - 1] = price;
  return out;
}

export const allStocks: StockItem[] = stockSeeds.map((s, i) => {
  const [id, name, sector, price, changePct, cap] = s;
  return {
    id,
    name,
    sector,
    price,
    changePct,
    change: Number(((price * changePct) / 100).toFixed(2)),
    volume: `${(0.4 + seed(i + 11) * 42).toFixed(1)}M`,
    cap,
    sparkline: sparklineFrom(price, i + 3),
  };
});

export const stockSectors = [
  'All', 'Technology', 'Semiconductors', 'Software', 'Space', 'Aerospace', 'EV',
  'Energy', 'Financials', 'Healthcare', 'Consumer', 'Industrial', 'ETF',
];

export const spaceEconomyIds = ['RKLB', 'ASTS', 'SPCE', 'LUNR', 'RDW', 'PL', 'IRDM', 'GSAT', 'VSAT', 'ARKX', 'UFO', 'ITA'];

// --- Alternative investments: 100+ across seven categories ---

const altImages = [
  'alt-estate', 'alt-commodity',
  'alt-deals', 'alt-infra',
  'alt-credit', 'alt-venture',
  'feat-stock', 'feat-estate',
];

const cities = ['Lisbon', 'Austin', 'Rotterdam', 'Nairobi', 'Osaka', 'Toronto', 'Valencia', 'Busan', 'Medellin', 'Helsinki', 'Perth', 'Doha', 'Porto', 'Accra', 'Tallinn', 'Bogota', 'Lyon', 'Sharjah'];
const assets = ['Logistics Park', 'Residential Tower', 'Data Centre', 'Solar Farm', 'Cold Storage', 'Medical Clinic', 'Coastal Hotel', 'Industrial Estate', 'Student Housing', 'Water Treatment Plant', 'Winery Estate', 'Metro Retail Block'];

const categories: { name: string; template: (i: number, place: string, asset: string) => string; min: number; max: number }[] = [
  {
    name: 'Real Estate',
    template: (i, place, asset) => `Income producing ${asset.toLowerCase()} in ${place}, managed by a local operating partner. Rent roll covers distributions, and the sponsor holds a first charge over the asset. Occupancy sits at ${72 + (i % 21)}% with the anchor tenant on a ${3 + (i % 6)} year lease.`,
    min: 6.4, max: 11.8,
  },
  {
    name: 'Commodities',
    template: (i, place, asset) => `Physically backed allocation sourced from ${place}, held with an insured custodian and audited ${2 + (i % 2)} times a year. Storage and insurance costs are netted against the return. Minimum lot size reflects current spot pricing on the settlement date.`,
    min: 3.8, max: 9.2,
  },
  {
    name: 'Private Deals',
    template: (i, place, asset) => `Pre IPO position in a ${place} based operator, currently ${i % 2 === 0 ? 'expanding' : 'consolidating'} its regional footprint. Entry is priced below the last primary round, with investor reporting issued quarterly and a board observer seat held by the fund.`,
    min: 12.0, max: 34.0,
  },
  {
    name: 'Infrastructure',
    template: (i, place, asset) => `Long dated infrastructure asset near ${place}. Revenue is contracted with an investment grade counterparty for the first ${8 + (i % 12)} years, which stabilises early distributions before any merchant exposure begins.`,
    min: 5.2, max: 8.9,
  },
  {
    name: 'Private Credit',
    template: (i, place, asset) => `Senior secured lending facility to a ${place} operating business, ${i % 3 === 0 ? 'with warrants attached' : 'with a covenant package reviewed monthly'}. Borrowers are screened on cash flow coverage before drawdown, and principal amortises over the term.`,
    min: 7.4, max: 13.2,
  },
  {
    name: 'Venture',
    template: (i, place, asset) => `Early stage ticket into a ${place} software team, ${i % 2 === 0 ? 'shipping to paying enterprise customers' : 'revenue positive on a trailing quarter basis'}. The fund takes a minority stake with pro rata rights and a liquidation preference.`,
    min: 15.0, max: 42.0,
  },
  {
    name: 'Collectibles',
    template: (i, place, asset) => `Authenticated collectible stored in climate controlled ${place} vaulting, insured at appraised value. Provenance documents and the grading certificate are held with the custodian and released to the buyer on exit.`,
    min: 4.2, max: 12.6,
  },
];

function buildAlternatives(): InvestmentItem[] {
  const out: InvestmentItem[] = [];
  let s = 101;
  categories.forEach((cat, ci) => {
    for (let i = 0; i < 16; i++) {
      s += 17;
      const place = cities[(ci * 16 + i) % cities.length];
      const asset = assets[(i * 3 + ci) % assets.length];
      const target = Math.round(1_500_000 + seed(s) * 44_000_000);
      const progress = 18 + Math.floor(seed(s + 5) * 78);
      out.push({
        id: `inv-${cat.name.toLowerCase().replace(/[^a-z]/g, '')}-${i + 1}`,
        name: `${place} ${asset} ${['Fund', 'Series', 'Programme', 'Trust'][i % 4]} ${String.fromCharCode(65 + ci)}${i + 1}`,
        category: cat.name,
        description: cat.template(i, place, asset),
        image: altImages[(ci + i) % altImages.length],
        progress,
        target,
        raised: Math.round((target * progress) / 100),
        returnMin: Number((cat.min + seed(s + 9) * 1.8).toFixed(1)),
        returnMax: Number((cat.max + seed(s + 13) * 2.4).toFixed(1)),
        timeline: `${6 + (i % 5) * 6} months`,
        verified: seed(s + 19) > 0.18,
      });
    }
  });
  return out;
}

export const generatedInvestments = buildAlternatives();

export const allInvestments: InvestmentItem[] = [
  ...(mockInvestments as InvestmentItem[]),
  ...generatedInvestments,
];

export const investmentCategories = [
  'All', 'Real Estate', 'Commodities', 'Private Deals', 'Infrastructure',
  'Private Credit', 'Venture', 'Collectibles',
];

