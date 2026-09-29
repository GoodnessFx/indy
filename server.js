// Indy API + static frontend in one process, dependency free (except `pg`
// for the optional Postgres store — same pattern as ShieldSafeBank).
//
// Serves the built Vite app from ./dist and exposes the JSON endpoints
// the frontend uses for shared chat + users:
//
//   GET  /api/health                         -> { ok, service, uptime }
//   GET  /api/chat/all                       -> every message, oldest first
//   GET  /api/chat/thread?account=EMAIL      -> one account's thread
//   GET  /api/chat/stream?account=EMAIL      -> SSE realtime stream (empty = admin)
//   GET  /api/chat/presence                  -> { adminsOnline }
//   POST /api/chat/send                      -> { account, name?, sender, body }
//   POST /api/chat/seen?account=EMAIL        -> clear the admin badge
//   POST /api/chat/login                     -> { account, name }
//   POST /api/chat/typing                    -> { account, role }
//   GET  /api/users/all                       -> every signup + login history
//   POST /api/users/login                    -> { email, name, method }
//   POST /api/upload                         -> { name, type, dataUrl } -> { id, url }
//   GET  /api/file/<id>                      -> the stored attachment bytes
//   GET  /api/scans                          -> card scans (front/back captures)
//   POST /api/scans                          -> record a card scan
//
// Storage (same as ShieldSafeBank, zero SQL-Editor steps):
//   1. Postgres via process.env.DATABASE_URL when set — tables are created
//      automatically on boot (CREATE TABLE IF NOT EXISTS). Survives restarts
//      and redeploys. Never hardcoded, never in git, never in VITE_*.
//   2. server/data/store.json fallback when DATABASE_URL is unset (local dev).
//
// Works on Render, on localhost, on any Node install.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let pg = null;
try {
  pg = require("pg");
} catch {
  pg = null; // local dev without `pg` installed — file store only
}

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(here, "dist");
const dataDir = path.join(here, "server", "data");
const storePath = path.join(dataDir, "store.json");

// --- Shared Postgres store (auto-migrates, no SQL Editor needed) ---
const DATABASE_URL = process.env.DATABASE_URL || "";
const pool = DATABASE_URL && pg
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: /localhost|127\.0\.0\.1/.test(DATABASE_URL) ? false : { rejectUnauthorized: false },
      max: 5,
    })
  : null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS chat_users (email TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS chat_logins (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS user_records (email TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS catalog_items (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS uploaded_files (id TEXT PRIMARY KEY, data JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS card_scans (id TEXT PRIMARY KEY, data JSONB NOT NULL);
`;

let dbReady = false;

async function initDb() {
  if (!pool) return;
  try {
    await pool.query(SCHEMA_SQL);
    dbReady = true;
    console.log("Chat store: Postgres (shared across devices/deploys)");
  } catch (err) {
    console.warn("Postgres unavailable, falling back to file store:", err?.message || err);
  }
}

async function dbAll(table) {
  if (!pool || !dbReady) return null;
  try {
    const r = await pool.query(`SELECT data FROM ${table}`);
    return r.rows.map((row) => row.data);
  } catch {
    return null;
  }
}

async function dbUpsert(table, keyCol, key, value) {
  if (!pool || !dbReady) return false;
  try {
    await pool.query(
      `INSERT INTO ${table} (${keyCol}, data) VALUES ($1, $2)
       ON CONFLICT (${keyCol}) DO UPDATE SET data = EXCLUDED.data`,
      [key, JSON.stringify(value)]
    );
    return true;
  } catch {
    return false;
  }
}

async function readChat() {
  const rows = await dbAll("chat_messages");
  if (rows) return rows;
  return readStore().chat;
}

async function saveMessage(message) {
  const ok = await dbUpsert("chat_messages", "id", message.id, message);
  if (ok) return;
  const store = readStore();
  if (!store.chat.some((m) => m.id === message.id)) store.chat.push(message);
  writeStore(store);
}

async function markSeenDb(account) {
  if (!pool || !dbReady) return false;
  try {
    await pool.query(
      `UPDATE chat_messages SET data = jsonb_set(data, '{seen}', 'true')
       WHERE data->>'account' = $1 AND data->>'sender' = 'client'`,
      [account]
    );
    return true;
  } catch {
    return false;
  }
}

// --- Admin-managed per-user records (profile, KYC, payout cards, balance) ---
// One JSON blob per account so an admin edit from anywhere reaches the client
// on any device. Audit entries are append-only and never rewritten.

const EMPTY_RECORD = {
  profile: {},
  kyc: "",
  payout: [],
  balanceAdjustments: [],
  soldEvents: [],
  portfolioValue: null,
  deleted: false,
  deletedAt: "",
};

async function readRecord(email) {
  const rows = await dbAll("user_records");
  if (rows) {
    // dbAll returns the unwrapped JSONB payloads, not { data } wrappers.
    const found = rows.find(
      (r) => r && String(r.email).toLowerCase() === String(email).toLowerCase()
    );
    return { ...EMPTY_RECORD, ...(found || {}), email };
  }
  const store = readStore();
  const found = (store.records || []).find(
    (r) => String(r.email).toLowerCase() === String(email).toLowerCase()
  );
  return { ...EMPTY_RECORD, ...(found || {}), email };
}

async function saveRecord(email, record) {
  const payload = { ...record, email, updatedAt: new Date().toISOString() };
  const ok = await dbUpsert("user_records", "email", email, payload);
  if (ok) return payload;
  const store = readStore();
  store.records = store.records || [];
  const idx = store.records.findIndex(
    (r) => String(r.email).toLowerCase() === String(email).toLowerCase()
  );
  if (idx >= 0) store.records[idx] = payload;
  else store.records.push(payload);
  writeStore(store);
  return payload;
}

// --- Uploaded files: chat attachments (images, video, documents) and the two
// card captures taken by the scanner. Bytes live in Postgres (`uploaded_files`)
// so an attachment survives a redeploy; on a local install with no
// DATABASE_URL the bytes land in server/data/uploads and only the metadata is
// kept in store.json, so both modes behave identically for the client.

const uploadDir = path.join(dataDir, "uploads");
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function safeName(value, fallback) {
  const clean = String(value || "").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 160);
  return clean || fallback;
}

function dataUrlToBuffer(dataUrl) {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(String(dataUrl || ""));
  if (!match) return null;
  const mime = match[1] || "application/octet-stream";
  const payload = match[3] || "";
  try {
    const buf = match[2]
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8");
    return { mime, buf };
  } catch {
    return null;
  }
}

async function saveUploadedFile(meta, buf) {
  const row = {
    id: meta.id,
    name: safeName(meta.name, "attachment"),
    type: meta.type || "application/octet-stream",
    size: buf.length,
    account: String(meta.account || ""),
    at: meta.at || new Date().toISOString(),
  };
  if (pool && dbReady) {
    try {
      await pool.query(
        `INSERT INTO uploaded_files (id, data) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
        [row.id, JSON.stringify({ ...row, data: buf.toString("base64") })]
      );
      return row;
    } catch { /* fall through to disk */ }
  }
  fs.mkdirSync(uploadDir, { recursive: true });
  const ext = (safeName(row.name, "file").match(/\.[a-z0-9]+$/i) || [""])[0].slice(0, 8);
  const file = path.join(uploadDir, `${row.id.replace(/[^a-zA-Z0-9_-]/g, "")}${ext}`);
  fs.writeFileSync(file, buf);
  const store = readStore();
  store.files = (store.files || []).filter((f) => f.id !== row.id);
  store.files.unshift({ ...row, file });
  writeStore(store);
  return row;
}

async function readUploadedFile(id) {
  if (pool && dbReady) {
    try {
      const { rows } = await pool.query("SELECT data FROM uploaded_files WHERE id = $1", [id]);
      const row = rows[0] && rows[0].data;
      if (row && row.data) {
        const decoded = dataUrlToBuffer(`data:${row.type || "application/octet-stream"};base64,${row.data}`);
        if (decoded) {
          const { data, ...meta } = row;
          void data;
          return { meta, buf: decoded.buf };
        }
      }
    } catch { /* fall through to disk */ }
  }
  const found = (readStore().files || []).find((f) => f.id === id);
  if (!found || !found.file || !fs.existsSync(found.file)) return null;
  return { meta: found, buf: fs.readFileSync(found.file) };
}

// --- Card scans: front + back capture per scan, shown in the admin console ---

async function readScans() {
  const rows = await dbAll("card_scans");
  const all = (rows ?? readStore().scans ?? []).slice();
  return all.sort((a, b) => (String(a.at) < String(b.at) ? 1 : -1)).slice(0, 200);
}

async function saveScan(scan) {
  const ok = await dbUpsert("card_scans", "id", scan.id, scan);
  if (ok) return scan;
  const store = readStore();
  store.scans = [scan, ...(store.scans || []).filter((s) => s.id !== scan.id)].slice(0, 200);
  writeStore(store);
  return scan;
}

async function readAudit() {
  const rows = await dbAll("audit_log");
  if (rows) return rows.sort((a, b) => (a.at < b.at ? 1 : -1));
  return (readStore().audit || []).sort((a, b) => (a.at < b.at ? 1 : -1));
}

async function appendAudit(entry) {
  const full = {
    id: `al-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    admin: String(entry.admin || "admin"),
    action: String(entry.action || "update"),
    target: String(entry.target || ""),
    detail: entry.detail || {},
  };
  const ok = await dbUpsert("audit_log", "id", full.id, full);
  if (ok) return full;
  const store = readStore();
  store.audit = [full, ...(store.audit || [])].slice(0, 500);
  writeStore(store);
  return full;
}

async function readItems(kind) {
  const rows = await dbAll("catalog_items");
  if (rows) {
    const all = rows.sort((a, b) => (String(a.createdAt) < String(b.createdAt || "") ? 1 : -1));
    return kind ? all.filter((i) => i.kind === kind) : all;
  }
  const store = readStore();
  const all = (store.items || []).sort((a, b) => (String(a.createdAt) < String(b.createdAt || "") ? 1 : -1));
  return kind ? all.filter((i) => i.kind === kind) : all;
}

async function saveItem(item) {
  const payload = { ...item, updatedAt: new Date().toISOString() };
  const ok = await dbUpsert("catalog_items", "id", payload.id, payload);
  if (ok) return payload;
  const store = readStore();
  store.items = store.items || [];
  const idx = store.items.findIndex((i) => i.id === payload.id);
  if (idx >= 0) store.items[idx] = payload;
  else store.items.unshift(payload);
  writeStore(store);
  return payload;
}

async function deleteItem(id) {
  if (pool && dbReady) {
    try {
      await pool.query("DELETE FROM catalog_items WHERE id = $1", [id]);
      return true;
    } catch { /* fall through */ }
  }
  const store = readStore();
  store.items = (store.items || []).filter((i) => i.id !== id);
  writeStore(store);
  return true;
}

async function readUsers() {
  const users = await dbAll("chat_users");
  const logins = await dbAll("chat_logins");
  if (users && logins) return { users, logins };
  const store = readStore();
  return { users: store.users || [], logins: store.logins || [] };
}

async function saveUserLogin(email, name, method) {
  const entry = {
    id: `lg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    email, name, method, at: new Date().toISOString(),
  };
  if (pool && dbReady) {
    try {
      const r = await pool.query(`SELECT data FROM chat_users WHERE email = $1`, [email]);
      const prev = r.rows[0]?.data || { email, name, createdAt: entry.at, loginCount: 0 };
      const next = {
        email, name: name || prev.name || email,
        createdAt: prev.createdAt || entry.at,
        lastLoginAt: entry.at,
        loginCount: (prev.loginCount || 0) + 1,
      };
      await dbUpsert("chat_users", "email", email, next);
      await dbUpsert("chat_logins", "id", entry.id, entry);
      return entry;
    } catch { /* fall through to file */ }
  }
  const store = readStore();
  store.users = store.users || [];
  store.logins = store.logins || [];
  const prev = store.users.find((u) => u.email === email);
  if (prev) {
    prev.name = name || prev.name;
    prev.lastLoginAt = entry.at;
    prev.loginCount = (prev.loginCount || 0) + 1;
  } else {
    store.users.push({ email, name, createdAt: entry.at, lastLoginAt: entry.at, loginCount: 1 });
  }
  store.logins.unshift(entry);
  store.logins = store.logins.slice(0, 1000);
  writeStore(store);
  return entry;
}

// Port discovery. Managed platforms inject PORT (Render, Railway, Koyeb),
// some inject APP_PORT or SERVER_PORT, and some just probe a fixed port and
// report "upstream connection refused" if nothing answers there. So: listen on
// every candidate we can get, and report clearly in the logs which one worked.
const CANDIDATES = [
  Number(process.env.PORT),
  Number(process.env.APP_PORT),
  Number(process.env.SERVER_PORT),
  8080,
  3000,
  4000,
  10000,
  8443,
  5000,
].filter((p, i, arr) => Number.isFinite(p) && p > 0 && p < 65536 && arr.indexOf(p) === i);

function readStore() {
  const empty = { chat: [], users: [], logins: [], records: [], audit: [], items: [], files: [], scans: [] };
  try {
    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return empty;
    const arr = (v) => (Array.isArray(v) ? v : []);
    return {
      chat: arr(parsed.chat),
      users: arr(parsed.users),
      logins: arr(parsed.logins),
      records: arr(parsed.records),
      audit: arr(parsed.audit),
      items: arr(parsed.items),
      files: arr(parsed.files),
      scans: arr(parsed.scans),
    };
  } catch {
    return empty;
  }
}

function writeStore(store) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "access-control-allow-origin": "*",
  });
  res.end(body);
}

// --- Realtime chat transport (Server-Sent Events, zero dependencies) ---
// Mirrors the ShieldSafeBank reference: every chat mutation fans out to all
// attached SSE subscribers instantly, so admin + client on any device/country
// see new messages with no polling and no refresh. EventSource auto-reconnects
// (retry: 3000) after network switches, sleeping tabs, or dropped connections.
const chatSubscribers = new Set();
let chatEventId = 0;

function broadcastChat(payload) {
  chatEventId += 1;
  const body = JSON.stringify({ ...payload, eventId: chatEventId });
  const frame = `id: ${chatEventId}\nevent: chat\ndata: ${body}\n\n`;
  for (const sub of chatSubscribers) {
    // Client streams only receive their own account's events; admin gets all.
    if (sub.account && payload.account && sub.account !== payload.account) continue;
    try {
      sub.res.write(frame);
    } catch {
      chatSubscribers.delete(sub);
    }
  }
}

function openChatStream(req, res, account) {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
    "access-control-allow-origin": "*",
  });
  res.write("retry: 3000\n\n");
  const sub = { res, account: String(account || ""), at: Date.now() };
  chatSubscribers.add(sub);
  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch { /* cleaned up on close */ }
  }, 25000);
  req.on("close", () => {
    clearInterval(heartbeat);
    chatSubscribers.delete(sub);
  });
}

function adminPresenceCount() {
  let n = 0;
  for (const sub of chatSubscribers) if (!sub.account) n += 1;
  return n;
}

function sanitiseAttachment(value) {
  if (!value || typeof value !== "object") return undefined;
  const url = String(value.url || "");
  const dataUrl = String(value.dataUrl || "");
  if (!url && !dataUrl) return undefined;
  const kind = ["image", "video", "audio", "file"].includes(value.kind) ? value.kind : "file";
  return {
    name: safeName(value.name, "attachment"),
    type: String(value.type || "application/octet-stream").slice(0, 120),
    size: Number(value.size) || 0,
    kind,
    url,
    dataUrl,
  };
}

function readBody(req, maxBytes = 400_000) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let overflowed = false;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        overflowed = true;
        req.destroy();
        resolve({});
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (overflowed) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return sendIndex(res);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function sendIndex(res) {
  return serveFile(res, path.join(distDir, "index.html"));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    return res.end();
  }

  // Health checks. Platforms probe these before routing traffic, so they must
  // answer even when the built frontend is missing.
  if (pathname === "/healthz" || pathname === "/health" || pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, service: "indy", uptime: process.uptime() });
  }

  if (pathname === "/api/chat/all" && req.method === "GET") {
    const chat = await readChat();
    const rows = chat.slice().sort((a, b) => (a.at < b.at ? -1 : 1)).slice(-500);
    return sendJson(res, 200, rows);
  }

  if (pathname === "/api/chat/thread" && req.method === "GET") {
    const account = url.searchParams.get("account") || "";
    const chat = await readChat();
    const rows = chat.filter((m) => m.account === account).sort((a, b) => (a.at < b.at ? -1 : 1));
    return sendJson(res, 200, rows);
  }

  if (pathname === "/api/users/record" && req.method === "GET") {
    const email = url.searchParams.get("email") || "";
    if (!email) return sendJson(res, 400, { error: "email required" });
    return sendJson(res, 200, await readRecord(email));
  }

  // Admin edits a client's record (profile, KYC, payout cards, balance notes).
  // Broadcast so the client's open session refreshes with no reload.
  if (pathname === "/api/users/record" && req.method === "POST") {
    const body = await readBody(req);
    const email = String(body.email || "");
    if (!email) return sendJson(res, 400, { error: "email required" });
    const current = await readRecord(email);
    const patch = body.patch && typeof body.patch === "object" ? body.patch : {};
    const next = { ...current, ...patch, email };
    delete next.updatedAt;
    const saved = await saveRecord(email, next);
    if (body.audit && typeof body.audit === "object") {
      await appendAudit({ ...body.audit, target: email });
    }
    broadcastChat({ type: "record", account: email });
    return sendJson(res, 200, saved);
  }

  if (pathname === "/api/audit/all" && req.method === "GET") {
    return sendJson(res, 200, await readAudit());
  }

  if (pathname === "/api/audit" && req.method === "POST") {
    const body = await readBody(req);
    const entry = await appendAudit(body);
    broadcastChat({ type: "audit", account: String(body.target || "") });
    return sendJson(res, 200, entry);
  }

  // Admin-managed catalog items (NFT list inserts). Stored server-side so a
  // listing added here is visible to every client on every device.
  if (pathname === "/api/items" && req.method === "GET") {
    const kind = url.searchParams.get("kind") || "";
    return sendJson(res, 200, await readItems(kind || undefined));
  }

  if (pathname === "/api/items" && req.method === "POST") {
    const body = await readBody(req);
    // `audit` is metadata for the trail, never part of the stored listing.
    const { audit, ...rest } = body && typeof body === "object" ? body : {};
    const id = String(rest.id || `item-${Date.now().toString(36)}`);
    const saved = await saveItem({
      ...rest,
      id,
      kind: rest.kind || "nft",
      createdAt: rest.createdAt || new Date().toISOString(),
    });
    if (audit && typeof audit === "object") {
      await appendAudit({ ...audit, target: id });
    }
    broadcastChat({ type: "item", account: "" });
    return sendJson(res, 200, saved);
  }

  if (pathname === "/api/items" && req.method === "DELETE") {
    const id = url.searchParams.get("id") || "";
    if (!id) return sendJson(res, 400, { error: "id required" });
    await deleteItem(id);
    await appendAudit({ action: "Delete listing", target: id, detail: { id }, admin: url.searchParams.get("admin") || "admin" });
    broadcastChat({ type: "item", account: "" });
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === "/api/users/all" && req.method === "GET") {
    const { users, logins } = await readUsers();
    const byEmail = new Map();
    for (const u of users) byEmail.set(String(u.email).toLowerCase(), { ...u, logins: [] });
    for (const l of logins) {
      const key = String(l.email || l.account || "").toLowerCase();
      if (!key) continue;
      if (!byEmail.has(key)) {
        byEmail.set(key, {
          email: l.email || l.account, name: l.name || l.email || l.account,
          createdAt: l.at, lastLoginAt: l.at, loginCount: 0, logins: [],
        });
      }
      byEmail.get(key).logins.push({ account: l.email || l.account, name: l.name, method: l.method, at: l.at });
    }
    const out = [...byEmail.values()].map((u) => ({
      email: u.email, name: u.name, createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt, loginCount: u.loginCount ?? u.logins.length,
      logins: u.logins.sort((a, b) => (a.at < b.at ? 1 : -1)),
    })).sort((a, b) => (String(a.lastLoginAt) < String(b.lastLoginAt) ? 1 : -1));
    return sendJson(res, 200, out);
  }

  if (pathname === "/api/users/login" && req.method === "POST") {
    const body = await readBody(req);
    const email = String(body.email || body.account || "");
    const name = String(body.name || email);
    const method = String(body.method || "email");
    if (!email) return sendJson(res, 400, { error: "email required" });
    const entry = await saveUserLogin(email, name, method);
    broadcastChat({ type: "login", account: email, entry });
    return sendJson(res, 200, { ok: true });
  }

  // Attachments for the support chat (images, video, documents) in BOTH
  // directions: the browser sends the file as a data URL, the bytes are stored
  // server-side, and a same-origin URL comes back to put on the message.
  if (pathname === "/api/upload" && req.method === "POST") {
    const body = await readBody(req, MAX_UPLOAD_BYTES * 2);
    const decoded = dataUrlToBuffer(body.dataUrl);
    if (!decoded) return sendJson(res, 400, { error: "dataUrl required" });
    if (decoded.buf.length > MAX_UPLOAD_BYTES) {
      return sendJson(res, 413, { error: "file too large", maxBytes: MAX_UPLOAD_BYTES });
    }
    const id = String(body.id || `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`)
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 80);
    const meta = await saveUploadedFile(
      { id, name: body.name, type: body.type || decoded.mime, account: body.account },
      decoded.buf
    );
    return sendJson(res, 200, { ...meta, url: `/api/file/${id}` });
  }

  if (pathname.startsWith("/api/file/") && req.method === "GET") {
    const id = decodeURIComponent(pathname.slice("/api/file/".length));
    const found = await readUploadedFile(id);
    if (!found) return sendJson(res, 404, { error: "not found" });
    res.writeHead(200, {
      "content-type": found.meta.type || "application/octet-stream",
      "content-length": found.buf.length,
      "cache-control": "private, max-age=31536000, immutable",
      "content-disposition": `inline; filename="${safeName(found.meta.name, "file")}"`,
      "access-control-allow-origin": "*",
    });
    return res.end(found.buf);
  }

  // Card scans: the front + back captures, readable by the admin console on any
  // device (not just the browser that ran the scan).
  if (pathname === "/api/scans" && req.method === "GET") {
    return sendJson(res, 200, await readScans());
  }

  if (pathname === "/api/scans" && req.method === "POST") {
    const body = await readBody(req, 4_000_000);
    const account = String(body.account || "");
    if (!account) return sendJson(res, 400, { error: "account required" });
    const images = (Array.isArray(body.images) ? body.images : [])
      .map((v) => String(v || ""))
      .filter(Boolean)
      .slice(0, 4);
    const scan = {
      id: String(body.id || `scan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`),
      label: String(body.label || "Scanned card"),
      last4: String(body.last4 || "").slice(0, 4),
      currency: String(body.currency || "USD"),
      account,
      name: String(body.name || account),
      image: String(body.image || images[0] || ""),
      images,
      source: String(body.source || ""),
      read: Boolean(body.read),
      at: String(body.at || new Date().toISOString()),
    };
    await saveScan(scan);
    broadcastChat({ type: "scan", account });
    return sendJson(res, 200, scan);
  }

  if (pathname === "/api/chat/send" && req.method === "POST") {
    const body = await readBody(req, 4_000_000);
    const account = String(body.account || "");
    const text = String(body.body || "").slice(0, 2000).trim();
    const attachment = sanitiseAttachment(body.attachment);
    const sender = body.sender === "agent" ? "agent" : "client";
    if (!account || (!text && !attachment)) {
      return sendJson(res, 400, { error: "account and body (or an attachment) are required" });
    }
    const message = {
      id: String(body.id || `m-${Date.now().toString(36)}`),
      account,
      name: String(body.name || account),
      sender,
      body: text,
      attachment,
      at: String(body.at || new Date().toISOString()),
      seen: sender === "agent",
    };
    await saveMessage(message);
    broadcastChat({ type: "chat", account, message });
    return sendJson(res, 200, message);
  }

  // Realtime stream: client holds ?account=EMAIL open; admin holds it open
  // with no account and receives every thread. Same pattern as ShieldSafeBank.
  if (pathname === "/api/chat/stream" && req.method === "GET") {
    const account = url.searchParams.get("account") || "";
    return openChatStream(req, res, account);
  }

  if (pathname === "/api/chat/presence" && req.method === "GET") {
    return sendJson(res, 200, { adminsOnline: adminPresenceCount() });
  }

  if (pathname === "/api/chat/login" && req.method === "POST") {
    const body = await readBody(req);
    const account = String(body.account || "");
    if (!account) return sendJson(res, 400, { error: "account required" });
    // No system/automated bubbles are inserted into the chat anymore. Only a
    // client's real messages and the agent's replies appear, so the thread
    // stays clean and professional instead of being padded with auto-replies.
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === "/api/chat/seen" && req.method === "POST") {
    const account = url.searchParams.get("account") || "";
    const marked = await markSeenDb(account);
    if (marked) {
      broadcastChat({ type: "read", account });
      return sendJson(res, 200, { ok: true });
    }
    const store = readStore();
    let changed = false;
    for (const m of store.chat) {
      if (m.account === account && m.sender === "client" && !m.seen) {
        m.seen = true;
        changed = true;
      }
    }
    if (changed) {
      writeStore(store);
      broadcastChat({ type: "read", account });
    }
    return sendJson(res, 200, { ok: true });
  }

  if (pathname === "/api/chat/typing" && req.method === "POST") {
    const body = await readBody(req);
    const account = String(body.account || url.searchParams.get("account") || "");
    const role = body.role === "agent" ? "agent" : "client";
    if (account) broadcastChat({ type: "typing", account, role });
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "GET") return sendJson(res, 404, { error: "not found" });
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes("..")) return sendIndex(res);
  const filePath = path.join(distDir, decoded === "/" ? "index.html" : decoded.slice(1));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }
  return sendIndex(res);
});

const listening = [];

function listenOn(port) {
  const onError = (err) => {
    console.log(`Port ${port} unavailable (${err.code}), trying the next candidate`);
    try { server.close(); } catch { /* ignore */ }
    next();
  };
  server.once("error", onError);
  server.listen(port, "0.0.0.0", () => {
    server.removeListener("error", onError);
    listening.push(port);
    console.log(`Indy app + chat API listening on 0.0.0.0:${port}`);
    if (distDir && !fs.existsSync(path.join(distDir, "index.html"))) {
      console.warn("dist/index.html not found. Run npm run build so the frontend is served.");
    }
  });
}

let index = 0;
function next() {
  if (index >= CANDIDATES.length) {
    console.error("No port could be bound. Candidates tried:", CANDIDATES.join(", "));
    process.exit(1);
  }
  const port = CANDIDATES[index];
  index += 1;
  listenOn(port);
}

console.log(`Port candidates: ${CANDIDATES.join(", ")}`);
void initDb();
next();
