// One registry for every photo on the site.
//
// Every ID here was checked with an HTTP HEAD request and returned 200,
// so a photo entry here means a photo that actually renders. Images marked
// with an empty string are awaiting a verified replacement and fall back to
// the branded placeholder tile, which is always better than a broken <img>
// or an unreviewed generated file.
//
// Do not paste remote image URLs anywhere else in the app. Add a new entry
// here, verify it, and use its key.

const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PHOTOS = {
  // Hero: city skyline at night, dark sky so white headline text stays legible.
  hero: U("photo-1477959858617-67f85cf4f1df", 1920),
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
  // NFT artwork surfaces.
  'art-orchid': U("photo-1618005182384-a83a8bd57fbe"),
  'art-cosmos': U("photo-1462331940025-496dfbfc7564"),
  'art-solar': U("photo-1614850715649-1d0106293bd1"),
  'art-mono': U("photo-1550684848-fac1c5b4e853"),
  'art-forest': U("photo-1518531933037-91b2f5f229cc"),
  'art-morph': U("photo-1614850523459-c2f4c699c52e"),
  // Alternative investment photography.
  'alt-estate': U("photo-1486406146926-c627a92ad1ab"),
  'alt-commodity': U("photo-1610375461246-83df859d849d"),
  'alt-deals': U("photo-1454165804606-c3d57bc86b40"),
  'alt-infra': U("photo-1480714378408-67cf0d13bc1b"),
  'alt-credit': U("photo-1554224155-6726b3ff858f"),
  'alt-venture': U("photo-1559136555-9303baea8ebd"),
  // Testimonial avatars.
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
