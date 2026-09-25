// One registry for every photo on the site.
//
// Every ID here was checked with an HTTP HEAD request and returned 200,
// so a photo entry here means a photo that actually renders. Anything without
// a verified photo renders the branded placeholder tile, which is always
// better than a broken <img> or an unreviewed generated file.
//
// Do not paste remote image URLs anywhere else in the app. Add a new entry
// here, verify it, and use its key.

const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Auction-grade artwork, every URL HEAD-verified (public domain museum scans
// from Wikimedia Commons). These are the NFT pieces clients see in the gallery:
// classical masters, flowers, animals, and a painted hare.
const WM = (path: string, file: string, px = 960) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${file}/${px}px-${file}`;

export const ARTWORK = {
  mona: WM("e/ec", "Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg"),
  wave: WM("a/a5", "Tsunami_by_hokusai_19th_century.jpg"),
  sunflowers: WM("9/9d", "Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg"),
  pearl: WM("0/0f", "1665_Girl_with_a_Pearl_Earring.jpg"),
  hare: WM("8/87", "Hans_Hoffmann_-_Hase_%281582%29.jpg"),
  flowers: WM("e/e2", "Jan_van_Huysum_-_Flower_Still_Life_%2814610442896%29.jpg"),
  horse: WM("b/bf", "George_Stubbs_-_Horse_Frightened_by_a_Lion_-_Google_Art_Project.jpg"),
  starry: WM("e/ea", "Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg"),
} as const;

export const PHOTOS = {
  // Hero slideshow: cinematic city and market scenes, dark enough that white
  // headline text stays legible. The homepage cycles through these.
  hero: U("photo-1477959858617-67f85cf4f1df", 1920),
  'hero-2': U("photo-1519501025264-65ba15a82390", 1920),
  'hero-3': U("photo-1486406146926-c627a92ad1ab", 1920),
  // Global reach map band: night earth from orbit.
  'global-map': U("photo-1451187580-47652a4f4078", 1200),
  // Three pillar cards.
  'pillar-nft': U("photo-1620641788421-7a1c342ea42e"),
  'pillar-stocks': U("photo-1611974789855-9c2a0a7236a3"),
  'pillar-alt': U("photo-1486406146926-c627a92ad1ab"),
  // Featured showcase thumbnails (five rotating picks).
  'feat-nft': U("photo-1618005182384-a83a8bd57fbe", 1200),
  'feat-stock': U("photo-1642790106117-e829e14a795f", 1200),
  'feat-estate': U("photo-1486406146926-c627a92ad1ab", 1200),
  'feat-space': U("photo-1446776811953-b23d57bd21aa", 1200),
  'feat-commodity': U("photo-1610375461246-83df859d849d", 1200),
  // NFT artwork surfaces: classical masterpieces plus nature and wildlife
  // studies, one unique image per listing.
  'art-orchid': ARTWORK.flowers,
  'art-cosmos': ARTWORK.starry,
  'art-solar': ARTWORK.sunflowers,
  'art-mono': ARTWORK.pearl,
  'art-forest': ARTWORK.wave,
  'art-morph': ARTWORK.horse,
  'art-tide': ARTWORK.mona,
  'art-ember': ARTWORK.hare,
  'art-iris': U("photo-1517849845537-4d257902454a"),
  'art-halo': U("photo-1494256997604-768d1f608cac"),
  'art-dune': U("photo-1470770841072-f978cf4d019e"),
  'art-reef': U("photo-1552083375-1447ce886485"),
  // Alternative investment photography.
  'alt-estate': U("photo-1486406146926-c627a92ad1ab"),
  'alt-commodity': U("photo-1610375461246-83df859d849d"),
  'alt-deals': U("photo-1454165804606-c3d57bc86b40"),
  'alt-infra': U("photo-1480714378408-67cf0d13bc1b"),
  'alt-credit': U("photo-1554224155-6726b3ff858f"),
  'alt-venture': U("photo-1559136555-9303baea8ebd"),
  // How It Works step imagery, matched to what each step actually does.
  'how-account': U("photo-1605792657660-596af9009e82"),
  'how-verify': U("photo-1450101499163-c8848c66ca85"),
  'how-fund': U("photo-1556742049-0cfed4f6a45d"),
  'how-invest': U("photo-1611974789855-9c2a0a7236a3"),
  'how-withdraw': U("photo-1526304640581-d334cdbbf45e"),
  // Card payment surface for scanned-card previews in the admin console.
  card: U("photo-1556742049-0cfed4f6a45d"),
  'avatar-1': U("photo-1494790108377-be9c29b29330", 400),
  'avatar-2': U("photo-1507003211169-0a1dd7228f2d", 400),
  'avatar-3': U("photo-1438761681033-6461ffad8d80", 400),
} as const;

export type PhotoKey = keyof typeof PHOTOS;

const WIKIMEDIA = "https://upload.wikimedia.org/wikipedia/commons/thumb";

export const VEHICLE_PHOTOS: Record<string, { src: string; credit: string }> = {
  'model-3': {
    src: `${WIKIMEDIA}/a/ab/Tesla_Model_3_%282023%29_Autofr%C3%BChling_Ulm_IMG_9282.jpg/1920px-Tesla_Model_3_%282023%29_Autofr%C3%BChling_Ulm_IMG_9282.jpg`,
    credit: "Tesla Model 3, 2023. Wikimedia Commons",
  },
  'model-y': {
    src: `${WIKIMEDIA}/5/5c/Tesla_Model_Y_1X7A6211.jpg/1920px-Tesla_Model_Y_1X7A6211.jpg`,
    credit: "Tesla Model Y. Wikimedia Commons",
  },
  'model-s': {
    src: `${WIKIMEDIA}/d/df/21_Tesla_Model_S_Plaid.jpg/1280px-21_Tesla_Model_S_Plaid.jpg`,
    credit: "Tesla Model S Plaid, 2021. Wikimedia Commons",
  },
  'model-x': {
    src: `${WIKIMEDIA}/c/c6/Tesla_Model_X_100D_1X7A6736.jpg/1280px-Tesla_Model_X_100D_1X7A6736.jpg`,
    credit: "Tesla Model X 100D. Wikimedia Commons",
  },
  cybertruck: {
    src: `${WIKIMEDIA}/2/26/2024_Tesla_Cybertruck%2C_Moab_02.jpg/1280px-2024_Tesla_Cybertruck%2C_Moab_02.jpg`,
    credit: "2024 Tesla Cybertruck, Moab. Wikimedia Commons",
  },
};

// Legacy image identifiers from the Figma export era. They are translated here
// so no caller can accidentally rebuild the broken
// `images.unsplash.com/asset-XXXX` URLs (every one of those returns 404).
// Entries without a verified replacement map to "" and render the branded
// placeholder tile.
const LEGACY: Record<string, PhotoKey | ""> = {
  'asset-1634193295': 'feat-nft',
  'asset-1618005182': 'art-morph',
  'asset-1558618666': 'art-solar',
  'asset-1549317661': 'art-mono',
  'asset-1500462918': 'art-forest',
  'asset-1535016120': 'art-cosmos',
  'asset-1518770660': 'feat-stock',
  'asset-1451187580': 'global-map',
  'asset-1486325212': 'alt-estate',
  'asset-1610375461': 'alt-commodity',
  'asset-1559757148': 'alt-deals',
  'asset-1512453979': 'alt-infra',
  'asset-1532996122': 'alt-credit',
  'curated-digital-collectibles': 'pillar-nft',
  'pillar-stocks': 'pillar-stocks',
  'pillar-alternative': 'pillar-alt',
  'asset-1531746020': 'art-cosmos',
  'asset-1463453091': 'art-mono',
  'asset-1487412720': 'avatar-3',
  'asset-1531123897': 'avatar-1',
  'asset-1472099645': 'avatar-2',
};

/** Full URL (or "") for any seed the app may pass to AssetImage or <img>. */
export function resolvePhoto(seed: string): string {
  if (!seed) return "";
  if (/^https?:\/\//.test(seed)) return seed;
  const key = (Object.keys(PHOTOS) as string[]).includes(seed)
    ? (seed as PhotoKey)
    : undefined;
  if (key) return PHOTOS[key];
  // Bare photo ids (for example a How It Works step id) resolve directly.
  if (/^photo-[a-z0-9-]+$/i.test(seed)) return U(seed);
  const legacy = LEGACY[seed];
  if (legacy === "") return "";
  if (legacy) return PHOTOS[legacy];
  return "";
}

/** True when the seed resolves to a real photo (not a placeholder tile). */
export function hasPhoto(seed: string): boolean {
  return resolvePhoto(seed) !== "";
}

/** Deterministic fallback tile for seeds with no photo yet. */
export function fallbackIndex(seed: string, size: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) & 0x7fffffff;
  }
  return Math.abs(h) % size;
}
