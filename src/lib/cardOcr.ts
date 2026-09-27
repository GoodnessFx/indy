// Card reading for the scanner.
//
// The scanner captures the front and the back of the card and then reads the
// NUMBER OFF THE FRONT (the back is only a second chance, for the rare card
// that prints its number there). Nothing is ever invented: a number is only
// accepted when it passes the Luhn checksum, otherwise the digits are handed to
// the review step flagged as unconfirmed so the client can correct them, and
// when nothing is readable the captures are still saved as images.
//
// Engine order:
//   1. tesseract.js, imported lazily so the main bundle stays small.
//   2. the platform TextDetector (Chrome on device) when the OCR package
//      cannot load, e.g. an offline device with no cached model.

export interface CardReading {
  /** Luhn-valid digits, blank when nothing trustworthy was read. */
  number: string;
  /** Digits that look like a PAN but failed the checksum, for review. */
  unverified: string;
  formatted: string;
  last4: string;
  expiry: string;
  holder: string;
  brand: string;
  raw: string;
  status: "read" | "partial" | "unreadable";
  engine: "tesseract" | "native" | "none";
}

export const EMPTY_READING: CardReading = {
  number: "",
  unverified: "",
  formatted: "",
  last4: "",
  expiry: "",
  holder: "",
  brand: "",
  raw: "",
  status: "unreadable",
  engine: "none",
};

export function digitsOnly(value: string): string {
  return (value || "").replace(/\D/g, "");
}

export function formatPan(digits: string): string {
  return digitsOnly(digits).replace(/(.{4})/g, "$1 ").trim();
}

/** Masked display: the hidden digits, with the last four visible. */
export function maskPan(digits: string): string {
  const four = digitsOnly(digits).slice(-4).padStart(4, "0");
  return `**** **** **** ${four}`;
}

export function luhnOk(digits: string): boolean {
  const value = digitsOnly(digits);
  if (value.length < 12 || value.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    let d = value.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Card brand from the issuer identification number (never a full PAN). */
export function brandFromNumber(digits: string): string {
  const n = digitsOnly(digits);
  if (!n) return "";
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "American Express";
  if (/^(6011|65|64[4-9])/.test(n)) return "Discover";
  if (/^3(0[0-5]|[68])/.test(n)) return "Diners Club";
  if (/^(2131|1800|35)/.test(n)) return "JCB";
  return "";
}

// OCR mangles the shapes it does not know: these are the substitutions that
// actually show up on printed card digits.
const CONFUSIONS: Record<string, string> = {
  O: "0", o: "0", Q: "0", D: "0", U: "0",
  I: "1", l: "1", i: "1", "|": "1", "!": "1",
  Z: "2", z: "2",
  A: "4", a: "4",
  S: "5", s: "5",
  G: "6", b: "6",
  T: "7", "?": "7",
  B: "8",
  g: "9", q: "9",
};

function deConfuse(text: string): string {
  return (text || "").replace(/[OoQDU|Il!iZzAaSsG bT?Bgq]/g, (c) => CONFUSIONS[c] ?? c);
}

/**
 * Best PAN candidates out of raw OCR text. A Luhn-valid group wins; when
 * nothing passes the checksum the longest plausible digit run is returned as
 * `unverified` so the client checks it instead of the scanner guessing.
 */
export function extractNumber(raw: string): { number: string; unverified: string } {
  const cleaned = deConfuse(raw).replace(/[^0-9\n]/g, " ");
  const groups: string[] = [];
  for (const line of cleaned.split(/\n+/)) {
    const runs = line.match(/\d[\d ]{9,24}\d/g) ?? [];
    for (const run of runs) groups.push(digitsOnly(run));
    const solid = line.match(/\d{12,19}/g) ?? [];
    for (const s of solid) groups.push(digitsOnly(s));
  }
  const candidates = [...new Set(groups.filter((g) => g.length >= 12 && g.length <= 19))]
    .sort((a, b) => b.length - a.length);
  const valid = candidates.find(luhnOk);
  if (valid) return { number: valid, unverified: "" };

  // The number may have straddled a line break: slide a window over every
  // digit in the capture and take the first Luhn-valid one, common lengths
  // first so a real 16-digit PAN wins over a coincidence.
  const all = digitsOnly(cleaned);
  for (const len of [16, 15, 19, 18, 17, 14, 13]) {
    for (let i = 0; i + len <= all.length; i += 1) {
      const window = all.slice(i, i + len);
      // The window must stand alone: refuse it when more digits touch either
      // end, so "4111 1111 1111 1112" cannot donate "1111 1111 1112".
      const leftDigit = i > 0 && /\d/.test(all[i - 1]);
      const rightDigit = i + len < all.length && /\d/.test(all[i + len]);
      if ((leftDigit || rightDigit) && all.length !== len) continue;
      if (luhnOk(window)) return { number: window, unverified: "" };
    }
  }
  return { number: "", unverified: candidates[0] ?? "" };
}

/** Expiry in MM/YY, only when the month is real and the year sane. */
export function extractExpiry(raw: string): string {
  // De-confuse first: OCR often reads the zero of "09/28" as the letter O.
  const text = deConfuse(raw || "").replace(/[|]/g, "/");
  // Lines are scanned longest-first so "VALID THRU 09/28" is judged as a whole
  // and a bare "03/43" fragment inside the long test number never wins.
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.includes("/") || line.includes("-") || line.includes("."));
  const ordered = [...lines.sort((a, b) => b.length - a.length), text];
  const matches: string[] = [];
  for (const line of ordered) {
    matches.push(...(line.match(/(0[1-9]|1[0-2])\s*[/\-.'’\s]{0,2}\s*(\d{2,4})/g) ?? []));
  }
  for (const match of matches) {
    const month = match.slice(0, 2);
    const rest = digitsOnly(match.slice(2));
    if (!rest) continue;
    const year = rest.length >= 4 ? rest.slice(2, 4) : rest.slice(0, 2);
    const yearNum = Number(year);
    if (yearNum >= 20 && yearNum <= 45) return `${month}/${year}`;
  }
  return "";
}

const HOLDER_STOP =
  /(bank|debit|credit|valid|through|since|prepaid|business|master|visa|card|check|authorized|authorised|signature|platinum|gold|world)/i;

/** The cardholder line: letters only, 2-4 words, nothing that belongs elsewhere. */
export function extractHolder(raw: string): string {
  const lines = (raw || "")
    .split(/\n+/)
    .map((l) => l.replace(/[^A-Za-z .'-]/g, " ").replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 5 && l.length <= 30);
  let best = "";
  for (const line of lines) {
    const words = line.split(" ").filter(Boolean);
    if (words.length < 2 || words.length > 4) continue;
    if (HOLDER_STOP.test(line)) continue;
    // Middle initials are fine, but at least two substantial words are needed
    // so a stray mark ("J Q" off a hologram) never becomes a name.
    if (words.filter(w => w.length >= 2).length < 2) continue;
    if (line.length > best.length) best = line;
  }
  return best.toUpperCase();
}

function parseReading(numeric: string, alpha: string, engine: CardReading["engine"]): CardReading {
  // Digits come from the whitelisted pass, the name from the plain pass, so a
  // word printed on the card can never be mistaken for a card number.
  const { number, unverified } = extractNumber(numeric);
  const digits = number || unverified;
  const expiry = extractExpiry(numeric);
  const holder = extractHolder(alpha);
  const brand = brandFromNumber(digits);
  const status: CardReading["status"] = number
    ? "read"
    : unverified || expiry || holder
    ? "partial"
    : "unreadable";
  return {
    number,
    unverified,
    formatted: formatPan(digits),
    last4: digitsOnly(digits).slice(-4),
    expiry,
    holder,
    brand,
    raw: `${numeric}\n${alpha}`.trim(),
    status,
    engine,
  };
}

/** Grayscale + contrast, at a width OCR can actually work with. */
async function preprocess(dataUrl: string, width: number): Promise<string> {
  if (!dataUrl) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(2.5, Math.max(1, width / img.width));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        for (let i = 0; i < px.length; i += 4) {
          const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          const boosted = Math.max(0, Math.min(255, (gray - 128) * 1.7 + 128));
          px[i] = boosted;
          px[i + 1] = boosted;
          px[i + 2] = boosted;
        }
        ctx.putImageData(data, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Horizontal band of the frame, used for a second, tighter OCR pass. */
async function cropBand(dataUrl: string, top: number, bottom: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const y = Math.round(img.height * top);
        const h = Math.max(40, Math.round(img.height * (bottom - top)));
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, y, img.width, h, 0, 0, img.width, h);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}


type TessWorker = {
  recognize: (image: unknown, options?: unknown, output?: unknown) => Promise<{ data: { text: string } }>;
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  terminate: () => Promise<unknown>;
};

let workerPromise: Promise<TessWorker> | null = null;

async function ocrWorker(onProgress?: (message: string) => void): Promise<TessWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const mod = await import("tesseract.js");
      const worker = await mod.createWorker("eng", 1, {
        logger: (m: { status?: string; progress?: number }) => {
          if (!onProgress || !m || !m.status) return;
          const pct = typeof m.progress === "number" ? ` ${Math.round(m.progress * 100)}%` : "";
          onProgress(`${m.status}${pct}`);
        },
      });
      return worker as unknown as TessWorker;
    })().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

/** Second engine: the platform text detector, when the OCR package fails. */
async function nativeText(dataUrl: string): Promise<string> {
  const detectorCtor = (window as unknown as {
    TextDetector?: new () => { detect: (source: unknown) => Promise<{ rawValue?: string }[]> };
  }).TextDetector;
  if (!detectorCtor) return "";
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const bitmap = await createImageBitmap(blob);
    const found = await new detectorCtor().detect(bitmap);
    return found.map((r) => r.rawValue || "").join("\n");
  } catch {
    return "";
  }
}

/**
 * Read a card from its captures. `front` is the primary source; the back is
 * only consulted as a second chance when the front produced nothing usable.
 */
export async function readCard(
  front: string,
  back: string,
  onProgress?: (message: string) => void
): Promise<CardReading> {
  if (!front && !back) return EMPTY_READING;
  onProgress?.("Preparing the capture");

  const frontFull = front ? await preprocess(front, 1600) : "";
  const frontBand = frontFull ? await cropBand(frontFull, 0.28, 0.72) : "";
  const backFull = back ? await preprocess(back, 1600) : "";
  const frontImages = [frontFull, frontBand].filter(Boolean);
  const backImages = [backFull].filter(Boolean);

  let engine: CardReading["engine"] = "tesseract";
  let numeric = "";
  let alpha = "";
  try {
    const worker = await ocrWorker(onProgress);

    // Pass 1: digits only. The whitelist keeps words off the number line, so
    // the PAN is read from real digits and nothing else.
    await worker.setParameters({
      tessedit_pageseg_mode: "6",
      tessedit_char_whitelist: "0123456789 /-",
      preserve_interword_spaces: "1",
    });
    for (const image of [...frontImages, ...backImages]) {
      onProgress?.("Reading the digits");
      const result = await worker.recognize(image);
      numeric += `\n${result?.data?.text ?? ""}`;
    }

    // Pass 2: plain text for the cardholder name (front only).
    await worker.setParameters({ tessedit_pageseg_mode: "6", tessedit_char_whitelist: "" });
    for (const image of frontImages.slice(0, 1)) {
      onProgress?.("Reading the cardholder name");
      const result = await worker.recognize(image);
      alpha += `\n${result?.data?.text ?? ""}`;
    }
  } catch {
    engine = "native";
    numeric = await nativeText(frontFull || front);
    numeric += `\n${await nativeText(backFull || back)}`;
    alpha = numeric;
  }

  return parseReading(numeric, alpha, engine);
}

/** Release the OCR worker — called when the scanner closes. */
export async function disposeOcr(): Promise<void> {
  const pending = workerPromise;
  workerPromise = null;
  if (!pending) return;
  try {
    const worker = await pending;
    await worker.terminate();
  } catch { /* nothing to release */ }
}
