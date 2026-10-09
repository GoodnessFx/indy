// Seed data initializer.
//
// Runs once on app start (called from main.tsx) to pre-populate demo client
// records in localStorage so the admin panel shows realistic data immediately,
// without needing a live backend. Each seed is written only when the key is
// absent — real admin edits always win and are never overwritten.

import type { UserRecord } from "./userRecords";

const RECORD_PREFIX = "indy_user_record_";

/** Write a seed record to localStorage only if no record exists yet for that
 *  email, so live admin edits are never silently reset. */
function seedRecord(rec: UserRecord): void {
  const key = `${RECORD_PREFIX}${rec.email.toLowerCase()}`;
  try {
    if (localStorage.getItem(key)) return; // already exists — leave it alone
    localStorage.setItem(key, JSON.stringify(rec));
  } catch {
    /* storage unavailable — skip silently */
  }
}

/** Seed all demo client records. Safe to call multiple times. */
export function initSeedData(): void {
  // Miguel Rodriguez — service fee changed from $1,000 to $872 on 2026-10-09.
  seedRecord({
    email: "miguel@example.com",
    profile: { name: "Miguel Rodriguez", phone: "+52 55 1234 5678", country: "MX" },
    kyc: "verified",
    payout: [],
    balanceAdjustments: [],
    soldEvents: [],
    portfolioValue: 45200,
    serviceFee: 872,
    serviceFeeHistory: [
      {
        id: "fee-seed-001",
        from: 1000,
        to: 872,
        reason: "Negotiated rate — updated billing from $1,000 to $872 per client agreement",
        at: "2026-10-09T08:00:00.000Z",
        admin: "admin",
      },
    ],
    deleted: false,
  });
}
