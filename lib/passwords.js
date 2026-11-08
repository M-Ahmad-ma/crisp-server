/* ==========================================================================
   Password hashing with Node's built-in crypto.scrypt — no native
   dependencies, memory-hard, and plenty for a single-admin console.

   Stored format: scrypt$N$r$p$<salt-b64>$<hash-b64>
   ========================================================================== */

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(String(password), salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, n, rr, pp, saltB64, hashB64] = String(stored).split("$");
    if (scheme !== "scrypt") return false;

    const expected = Buffer.from(hashB64, "base64");
    const actual = await scrypt(String(password), Buffer.from(saltB64, "base64"), expected.length, {
      N: Number(n),
      r: Number(rr),
      p: Number(pp),
    });

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
