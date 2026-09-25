// Account profile and device uploads (avatar, identity document, proof of
// address), plus a full data export as a device download.
//
// Images are read from the user's device, downscaled in <canvas> to a sane size
// and stored as JPEG data URLs in the profile, which is what lets the avatar
// preview instantly. A real backend would move these to object storage; the
// function names stay the same when it does.

import { getStoredGoogleUser } from "./googleAuth";

export interface AccountProfile {
  firstName: string;
  lastName: string;
  dob: string;
  country: string;
  phone: string;
  email: string;
  idType: string;
  avatar?: string;
  avatarName?: string;
  documents: { kind: string; label: string; name: string; at: string; dataUrl?: string }[];
}

const KEY = `indy_account_profile`;

function emptyEmail(): string {
  return getStoredGoogleUser()?.email ?? "guest";
}

export function getAccountProfile(): AccountProfile {
  try {
    const raw = localStorage.getItem(`${KEY}_${emptyEmail()}`);
    if (raw) {
      const p = JSON.parse(raw) as AccountProfile;
      if (p && typeof p === "object") return p;
    }
  } catch { /* fall through */ }
  const google = getStoredGoogleUser();
  return {
    firstName: (google?.given_name || (google?.name ?? "").split(" ")[0] || ""),
    lastName: (google?.family_name || (google?.name ?? "").split(" ").slice(1).join(" ") || ""),
    dob: "",
    country: "",
    phone: "",
    email: google?.email ?? "",
    idType: "passport",
    documents: [],
  };
}

export function saveAccountProfile(patch: Partial<AccountProfile>): AccountProfile {
  const next = { ...getAccountProfile(), ...patch };
  try {
    localStorage.setItem(`${KEY}_${next.email || emptyEmail()}`, JSON.stringify(next));
  } catch { /* storage unavailable */ }
  return next;
}

/**
 * Read an image from the user's device and downscale it to a compact JPEG data
 * URL (bounded to maxDim on the longest side). Keeps local storage small while
 * still giving an instant preview.
 */
export async function fileToDataUrl(file: File, maxDim = 1024, quality = 0.72): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not process the image");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        reject(new Error("Could not process the image"));
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the image"));
    };
    img.src = objectUrl;
  });
}

/** Bundle the client's own data into a download the user saves to their device. */
export function exportAccountData(): void {
  const google = getStoredGoogleUser();
  const { myOrders } = require_orders();
  const { myTickets } = require_audit();
  const { userNotes } = require_notes();
  const data = {
    exportedAt: new Date().toISOString(),
    account: google?.email ?? "guest",
    profile: getAccountProfile(),
    orders: myOrders(),
    tickets: myTickets(),
    notifications: userNotes(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "indy-account-data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Lazy imports to keep the storage module free of UI-layer coupling at init.
function require_orders() {
  return { myOrders: () => readNs("indy_", "_orders") };
}
function require_audit() {
  return { myTickets: () => readNs("indy_admin_ticket_feed_", "") };
}
function require_notes() {
  return { userNotes: () => readNs("indy_user_notes_", "") };
}
function readNs(prefix: string, suffix: string): unknown[] {
  try {
    return JSON.parse(localStorage.getItem(`${prefix}${accountKey()}${suffix}`) || "[]") as unknown[];
  } catch {
    return [];
  }
}
function accountKey(): string {
  return getStoredGoogleUser()?.email ?? getStoredGoogleUser()?.sub ?? "guest";
}