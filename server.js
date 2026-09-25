// Indy API + static frontend in one process, dependency free.
//
// Serves the built Vite app from ./dist and exposes the tiny JSON endpoints
// the frontend uses for shared chat:
//
//   GET  /api/chat/all                       -> every message, oldest first
//   GET  /api/chat/thread?account=EMAIL      -> one account's thread
//   POST /api/chat/send                      -> { account, name?, sender, body }
//   POST /api/chat/seen?account=EMAIL        -> clear the admin badge
//
// Messages live in server/data/store.json:
//   { "chat": [ { id, account, name, sender, body, at, seen } ] }
//
// Works on Render, on localhost, on any Node install. No database, no tables,
// no SDK.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(here, "dist");
const dataDir = path.join(here, "server", "data");
const storePath = path.join(dataDir, "store.json");

const PORT = Number(process.env.PORT || 4000);

function readStore() {
  try {
    const raw = fs.readFileSync(storePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.chat)) {
      return { chat: [] };
    }
    return parsed;
  } catch {
    return { chat: [] };
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

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 200_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
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

  if (pathname === "/api/chat/all" && req.method === "GET") {
    const store = readStore();
    const rows = store.chat.slice().sort((a, b) => (a.at < b.at ? -1 : 1)).slice(-500);
    return sendJson(res, 200, rows);
  }

  if (pathname === "/api/chat/thread" && req.method === "GET") {
    const account = url.searchParams.get("account") || "";
    const store = readStore();
    const rows = store.chat.filter((m) => m.account === account).sort((a, b) => (a.at < b.at ? -1 : 1));
    return sendJson(res, 200, rows);
  }

  if (pathname === "/api/chat/send" && req.method === "POST") {
    const body = await readBody(req);
    const account = String(body.account || "");
    const text = String(body.body || "").slice(0, 2000).trim();
    const sender = body.sender === "agent" ? "agent" : "client";
    if (!account || !text) return sendJson(res, 400, { error: "account and body are required" });
    const store = readStore();
    const message = {
      id: String(body.id || `m-${Date.now().toString(36)}`),
      account,
      name: String(body.name || account),
      sender,
      body: text,
      at: String(body.at || new Date().toISOString()),
      seen: sender === "agent",
    };
    if (!store.chat.some((m) => m.id === message.id)) store.chat.push(message);
    writeStore(store);
    return sendJson(res, 200, message);
  }

  if (pathname === "/api/chat/seen" && req.method === "POST") {
    const account = url.searchParams.get("account") || "";
    const store = readStore();
    let changed = false;
    for (const m of store.chat) {
      if (m.account === account && m.sender === "client" && !m.seen) {
        m.seen = true;
        changed = true;
      }
    }
    if (changed) writeStore(store);
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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Indy app + chat API listening on :${PORT}`);
});
