#!/usr/bin/env node
// Idempotent migration runner for IndySolutions.
//
// Reads the database from process.env.DATABASE_URL ONLY, never from a file or
// from a hardcoded value. Applies supabase/schema.sql against that database and
// is safe to re-run: existing types, tables, indexes and policies are skipped
// (or replaced) instead of erroring.
//
// Requires a Postgres client. Install it ad hoc wherever you run this:
//
//   npm i --no-save pg        # or: pnpm add -D pg   (then remove if undesired)
//
// Usage:
//   DATABASE_URL="postgresql://..." node supabase/migrate.mjs --check   # connectivity only
//   DATABASE_URL="postgresql://..." node supabase/migrate.mjs           # apply schema.sql
//
// Never put DATABASE_URL in a VITE_* variable or anywhere the browser reads.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_FILE = join(__dirname, 'schema.sql');
const checkOnly = process.argv.includes('--check');

const DATABASE_URL = process.env.DATABASE_URL || '';
if (!DATABASE_URL || !DATABASE_URL.startsWith('postgres')) {
  console.error('Missing DATABASE_URL. Set it as an environment variable before running.');
  console.error('Example: DATABASE_URL="postgresql://user:pass@host:5432/db"');
  process.exit(2);
}

let pg;
try {
  pg = (await import('pg')).default;
} catch {
  console.error('The "pg" driver is not installed. Run: npm i --no-save pg');
  process.exit(2);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 15000,
  ssl: { rejectUnauthorized: false }, // Supabase pooler requires TLS
});

function strip(s) {
  return s.replace(/^--.*$/gm, '').trim();
}

async function tableExists(name) {
  const r = await client.query('select to_regclass($1) as t', [name]);
  return r.rows[0]?.t != null;
}

async function typeExists(name) {
  const r = await client.query('select 1 from pg_type where typname = $1', [name]);
  return r.rowCount > 0;
}

async function hasPolicy(table, name) {
  const r = await client.query(
    'select 1 from pg_policies where tablename = $1 and policyname = $2',
    [table, name]
  );
  return r.rowCount > 0;
}

// Split into statements. The current schema is plain DDL (no PL/pgSQL bodies),
// so a simple split on ';' is safe. Kept explicit so a future body block is
// not silently mangled.
function statements(sql) {
  return sql
    .split(';')
    .map(strip)
    .filter(Boolean)
    .map(s => s + ';');
}

let applied = 0;
let skipped = 0;

async function apply(sqlText) {
  const upper = sqlText.toUpperCase();
  const tableMatch = upper.match(/^CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/);
  const typeMatch = upper.match(/^CREATE TYPE\s+(\w+)/);
  const idxMatch = upper.match(/^CREATE INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/);
  const policyMatch = upper.match(/^CREATE POLICY\s+"?(\w+)"?\s+ON\s+(\w+)/);

  if (typeMatch) {
    const name = typeMatch[1].toLowerCase();
    if (await typeExists(name)) { skipped++; return; }
  } else if (tableMatch) {
    const name = tableMatch[1].toLowerCase();
    if (await tableExists(name)) { skipped++; return; }
  } else if (idxMatch) {
    const name = idxMatch[1].toLowerCase();
    try {
      const r = await client.query('select 1 from pg_indexes where indexname = $1', [name]);
      if (r.rowCount > 0) { skipped++; return; }
    } catch { /* fall through to try create */ }
  } else if (policyMatch) {
    const table = policyMatch[2].toLowerCase();
    const name = policyMatch[1].toLowerCase();
    if (await hasPolicy(table, name)) { skipped++; return; }
  }

  await client.query(sqlText);
  applied++;
}

export async function main() {
  await client.connect();
  console.log('Connected to database.');

  // Connectivity check: confirm we can read from the main tables if they exist.
  if (checkOnly) {
    for (const table of ['users', 'portfolios', 'transactions']) {
      const exists = await tableExists(table);
      console.log(`  ${table.padEnd(14)} ${exists ? 'present' : 'absent'}`);
    }
    await client.end();
    console.log('Connectivity OK. Run without --check to apply supabase/schema.sql.');
    return;
  }

  const sql = readFileSync(SCHEMA_FILE, 'utf8');
  for (const stmt of statements(sql)) {
    await apply(stmt);
  }
  await client.end();
  console.log(`Migration complete: ${applied} applied, ${skipped} skipped (already present).`);
}

main().catch(async (err) => {
  console.error('Migration failed:', err?.message || err);
  try { await client.end(); } catch { /* ignore */ }
  process.exit(1);
});
