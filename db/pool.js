/* ==========================================================================
   PostgreSQL pool + tiny query helpers. Every call is parameterized —
   no string interpolation of user input anywhere.
   ========================================================================== */

import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

/** Run a parameterized query. */
export function query(text, params) {
  return pool.query(text, params);
}

/** Run `fn(client)` inside a transaction, committing or rolling back. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* connection already broken — the pool will discard it */
    }
    throw err;
  } finally {
    client.release();
  }
}
