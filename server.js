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

  // Health checks. Platforms probe these before routing traffic, so they must
  // answer even when the built frontend is missing.
  if (pathname === "/healthz" || pathname === "/health" || pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, service: "indy", uptime: process.uptime() });
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

  if (pathname === "/api/chat/login" && req.method === "POST") {
    const body = await readBody(req);
    const account = String(body.account || "");
    const name = String(body.name || account);
    if (!account) return sendJson(res, 400, { error: "account required" });
    const store = readStore();
    // Only push a login notification once per session (avoid spam)
    const recentLogin = store.chat.find(
      m => m.account === account && m.sender === "system" &&
        Date.now() - new Date(m.at).getTime() < 60 * 60 * 1000
    );
    if (!recentLogin) {
      const note = {
        id: `login-${Date.now().toString(36)}`,
        account,
        name,
        sender: "system",
        body: `🔔 ${name} just logged in`,
        at: new Date().toISOString(),
        seen: false,
      };
      store.chat.push(note);
      writeStore(store);
    }
    return sendJson(res, 200, { ok: true });
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
next();
