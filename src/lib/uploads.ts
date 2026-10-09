// Attachments for the support chat — images, video, audio and documents, in
// BOTH directions (client to admin, admin to client).
//
// Images are downscaled on the device before they leave it, so a 12 MP phone
// photo travels as a few hundred KB instead of 6 MB. Everything else is sent
// as-is, up to MAX_ATTACHMENT_BYTES.
//
// Delivery, best to worst:
//   1. POST /api/upload -> a same-origin URL that survives reloads and is
//      visible to the admin console on any device.
//   2. an inline data URL carried inside the message itself, for small files,
//      when the API cannot be reached — a message is never silently dropped.

import { apiFetch } from "./config";

export interface Attachment {
  name: string;
  type: string;
  size: number;
  kind: "image" | "video" | "audio" | "file";
  /** Server-side URL, present once the upload succeeded. */
  url?: string;
  /** Inline fallback payload, used only when the upload could not run. */
  dataUrl?: string;
}

/** Client-side ceiling. The server decodes and stores up to 25 MB. */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
/** Largest inline fallback the chat message itself can carry. */
const INLINE_LIMIT = 2_400_000;

export function kindOf(type: string): Attachment["kind"] {
  const t = (type || "").toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  return "file";
}

export function formatBytes(bytes: number): string {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** What to put in an <img>/<video>/<a> href. */
export function attachmentSrc(attachment: Attachment): string {
  return attachment.url || attachment.dataUrl || "";
}

export function describeAttachment(attachment: Attachment): string {
  return `${attachment.name} · ${formatBytes(attachment.size)}`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`${file.name} could not be read from this device.`));
    reader.readAsDataURL(file);
  });
}

/** Exported for the scanner: a picked or captured image becomes a data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return readAsDataUrl(file);
}

/** Turn a data URL into a File so it can go through the same upload path. */
export function dataUrlToFile(dataUrl: string, name: string): File | null {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl || "");
  if (!match) return null;
  try {
    const [, mime, isBase64, payload] = match;
    const binary = isBase64 ? atob(payload) : decodeURIComponent(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], name, { type: mime || "application/octet-stream" });
  } catch {
    return null;
  }
}

/**
 * Upload a capture (a data URL) and return its attachment. When the upload
 * cannot run, the data URL itself is returned so the picture is never lost.
 */
export async function uploadDataUrl(
  dataUrl: string,
  name: string,
  options: { account?: string; onProgress?: (label: string) => void } = {}
): Promise<Attachment | null> {
  if (!dataUrl) return null;
  const file = dataUrlToFile(dataUrl, name);
  if (file) {
    try {
      return await uploadFile(file, options);
    } catch { /* keep the inline capture below */ }
  }
  const size = dataUrlLength(dataUrl);
  return { name, type: "image/jpeg", size, kind: "image", dataUrl };
}

/** JPEG at a bounded size — the difference between a fast upload and a stall. */
async function shrinkImage(file: File, maxDim = 1800, quality = 0.82): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("image decode failed"));
      element.src = objectUrl;
    });
    let { width, height } = img;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function dataUrlLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl.length;
  return Math.round((dataUrl.length - comma - 1) * 0.75);
}

/**
 * Prepare one file and get it to the server. Throws with a message that can be
 * shown to the client; a returned attachment is always sendable.
 */
export async function uploadFile(
  file: File,
  options: { account?: string; onProgress?: (label: string) => void } = {}
): Promise<Attachment> {
  if (!file) throw new Error("No file was selected.");
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_ATTACHMENT_BYTES)}.`
    );
  }
  const kind = kindOf(file.type || "");
  options.onProgress?.(`Preparing ${file.name}`);

  let name = file.name || "attachment";
  let type = file.type || "application/octet-stream";
  let dataUrl: string;
  if (kind === "image") {
    try {
      dataUrl = await shrinkImage(file);
      type = "image/jpeg";
      name = `${name.replace(/\.[a-z0-9]+$/i, "")}.jpg`;
    } catch {
      dataUrl = await readAsDataUrl(file);
    }
  } else {
    dataUrl = await readAsDataUrl(file);
  }
  if (!dataUrl) throw new Error(`${file.name} could not be prepared.`);

  const size = dataUrlLength(dataUrl) || file.size;
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await wait(700 * attempt);
    try {
      options.onProgress?.(`Uploading ${file.name}`);
      const saved = (await apiFetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({ name, type, dataUrl, account: options.account || "" }),
      })) as { id?: string; url?: string; size?: number };
      const url = saved.url || (saved.id ? `/api/file/${saved.id}` : "");
      if (url) return { name, type, size: saved.size || size, kind, url };
      lastError = new Error("The server did not return a file reference.");
      continue;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Upload failed.");
      if (/limit|too large|413/i.test(lastError.message)) throw lastError;
    }
  }

  // The API is unreachable: small files still travel inside the message so the
  // client is never left with a message that silently did not send.
  if (dataUrl.length <= INLINE_LIMIT) {
    options.onProgress?.("Sending without the server");
    return { name, type, size, kind, dataUrl };
  }
  throw new Error(
    lastError
      ? `${lastError.message} ${name} is too large to send without the server - check your connection and try again.`
      : `${name} could not be uploaded. Check your connection and try again.`
  );
}

/** Upload several files, keeping the ones that made it even if one fails. */
export async function uploadFiles(
  files: File[],
  options: { account?: string; onProgress?: (label: string) => void } = {}
): Promise<{ attachments: Attachment[]; errors: string[] }> {
  const attachments: Attachment[] = [];
  const errors: string[] = [];
  for (const file of files) {
    try {
      attachments.push(await uploadFile(file, options));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${file.name} failed.`);
    }
  }
  return { attachments, errors };
}


const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
