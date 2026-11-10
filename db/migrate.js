/* ==========================================================================
   migrate.js — create the schema (idempotent) and seed it.

   Seeding rules:
     • admin user      → only when the users table is empty
     • content         → page copy only; merges missing keys, never
                         overwrites an existing key
     • products/jobs/team → only when the table is empty. The first
                         release's demo rows (p_1/j_1/t_1 style) are
                         detected and replaced by the unified seed; a
                         table holding any user-created row is kept.

   So re-running `npm run db:migrate` is always safe.

   Usage: npm run db:migrate
   ========================================================================== */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { query, pool } from "./pool.js";
import { config } from "../config.js";
import { hashPassword } from "../lib/passwords.js";

/* ── seed data lives inside the server (no frontend imports here) ────── */

import CONTENT from "../seed/content.js";
import { PRODUCTS, JOBS, TEAM } from "../seed/admin.js";

/* Stagger seed timestamps so the public site keeps the seed order
   (oldest first) while the admin lists newest first. */
const SEED_BASE = Date.UTC(2026, 0, 1, 9, 0, 0);

function seededAt(index) {
  return new Date(SEED_BASE + index * 60_000);
}

/* ── migrate ────────────────────────────────────────────────────────────── */

async function migrate() {
  const schema = readFileSync(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
  await query(schema);
  console.log("  ✓ schema up to date");
}

async function seedUsers() {
  const { rows } = await query("SELECT count(*)::int AS n FROM users");
  if (rows[0].n > 0) {
    console.log(`  • users: PostgreSQL "users" table already has rows — seed skipped`);
    return;
  }

  const id = `u_${Date.now().toString(36)}`;
  const passwordHash = await hashPassword(config.admin.password);

  await query(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'admin')",
    [id, config.admin.email, passwordHash, config.admin.name],
  );

  console.log(`  ✓ admin user: .env ADMIN_* → PostgreSQL "users" table (${config.admin.email})`);
}

/* Content rows used to hold products/jobs/team as JSON. Those domains are
   now composed from their tables, so drop the stale copies once. */
async function pruneLegacyContent() {
  const removed = [];

  const productsRow = await query("DELETE FROM content WHERE domain = 'products'");
  if (productsRow.rowCount) removed.push("products row");

  const jobsRow = await query(
    `UPDATE content SET data = data - 'JOBS' - 'JOB_DEPARTMENTS'
     WHERE domain = 'jobs' AND (data ? 'JOBS' OR data ? 'JOB_DEPARTMENTS')`,
  );
  if (jobsRow.rowCount) removed.push("jobs.JOBS/JOB_DEPARTMENTS");

  const teamRow = await query(
    "UPDATE content SET data = data - 'TEAM' WHERE domain = 'team' AND data ? 'TEAM'",
  );
  if (teamRow.rowCount) removed.push("team.TEAM");

  if (removed.length) {
    console.log(`  • content: dropped legacy copies now served from tables — ${removed.join(", ")}`);
  }
}

async function seedContent() {
  let changed = 0;

  for (const [domain, data] of Object.entries(CONTENT)) {
    /* Fresh domain → insert. Existing row → merge so that seed keys the row
       is missing get added, while any key already present (i.e. edited via
       SQL or a future admin UI) is left untouched. */
    const { rowCount } = await query(
      `INSERT INTO content (domain, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (domain) DO UPDATE
         SET data = excluded.data || content.data,
             updated_at = now()
         WHERE excluded.data || content.data IS DISTINCT FROM content.data`,
      [domain, JSON.stringify(data)],
    );
    changed += rowCount;
  }

  const total = Object.keys(CONTENT).length;
  const upToDate = total - changed;
  console.log(`  ✓ content: seed/content.js → PostgreSQL "content" table — ${changed} inserted/updated, ${upToDate} already up to date`);
}

/* The first release shipped demo rows with ids like p_1 / j_1 / t_1. If
   (and only if) EVERY row in a table matches that pattern, the whole set
   is replaced by the unified seed. User-created ids don't match, so a
   table holding real data is never wiped. */
async function clearLegacyDemoRows(table, prefix) {
  const { rows } = await query(`SELECT id FROM ${table}`);
  if (!rows.length) return;

  const demo = new RegExp(`^${prefix}_[0-9]+$`);
  if (!rows.every((row) => demo.test(row.id))) return;

  await query(`DELETE FROM ${table}`);
  console.log(`  • ${table}: removed ${rows.length} legacy demo row(s) — replaced by the unified seed`);
}

function insertRow(table, row) {
  const keys = Object.keys(row);
  const params = keys.map((_, i) => `$${i + 1}`);

  return query(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${params.join(", ")}) ON CONFLICT (id) DO NOTHING`,
    keys.map((key) => row[key]),
  );
}

async function seedProducts() {
  await clearLegacyDemoRows("products", "p");

  const { rows } = await query("SELECT count(*)::int AS n FROM products");
  if (rows[0].n > 0) {
    console.log(`  • products: PostgreSQL "products" table already has rows — seed skipped`);
    return;
  }

  for (const [index, p] of PRODUCTS.entries()) {
    await insertRow("products", {
      id: p.id,
      name: p.name,
      slug: p.slug ?? null,
      category: p.category ?? null,
      flavor: p.flavor ?? null,
      price: p.price ?? 0,
      weight: p.weight ?? null,
      stock: p.stock ?? 0,
      status: p.status ?? "active",
      description: p.description ?? null,
      image: p.image || null,
      created_at: seededAt(index),
    });
  }

  console.log(`  ✓ products: seed/admin.js → PostgreSQL "products" table — ${PRODUCTS.length} rows`);
}

async function seedJobs() {
  await clearLegacyDemoRows("jobs", "j");

  const { rows } = await query("SELECT count(*)::int AS n FROM jobs");
  if (rows[0].n > 0) {
    console.log(`  • jobs: PostgreSQL "jobs" table already has rows — seed skipped`);
    return;
  }

  for (const [index, j] of JOBS.entries()) {
    await insertRow("jobs", {
      id: j.id,
      slug: j.slug ?? null,
      title: j.title,
      department: j.department ?? null,
      location: j.location ?? null,
      type: j.type ?? null,
      experience: j.experience ?? null,
      salary_min: j.salaryMin ?? null,
      salary_max: j.salaryMax ?? null,
      salary_currency: j.salaryCurrency ?? "USD",
      salary_display: j.salaryDisplay ?? null,
      status: j.status ?? "open",
      openings: j.openings ?? 1,
      applicants: j.applicants ?? 0,
      shift: j.shift ?? null,
      icon: j.icon ?? null,
      summary: j.summary ?? null,
      description: j.description ?? null,
      responsibilities: JSON.stringify(j.responsibilities ?? []),
      requirements: JSON.stringify(j.requirements ?? []),
      benefits: JSON.stringify(j.benefits ?? []),
      posted_at: j.postedAt ? new Date(j.postedAt) : null,
      created_at: seededAt(index),
    });
  }

  console.log(`  ✓ jobs: seed/admin.js → PostgreSQL "jobs" table — ${JOBS.length} rows`);
}

async function seedTeam() {
  await clearLegacyDemoRows("team", "t");

  const { rows } = await query("SELECT count(*)::int AS n FROM team");
  if (rows[0].n > 0) {
    console.log(`  • team: PostgreSQL "team" table already has rows — seed skipped`);
    return;
  }

  for (const [index, t] of TEAM.entries()) {
    await insertRow("team", {
      id: t.id,
      name: t.name,
      role: t.role ?? null,
      email: t.email ?? null,
      phone: t.phone ?? null,
      department: t.department ?? null,
      status: t.status ?? "active",
      bio: t.bio ?? null,
      avatar: t.avatar || null,
      joined_at: t.joinedAt ? new Date(t.joinedAt) : null,
      is_owner: Boolean(t.isOwner),
      quote: t.quote ?? null,
      credentials: JSON.stringify(t.credentials ?? []),
      created_at: seededAt(index),
    });
  }

  console.log(`  ✓ team: seed/admin.js → PostgreSQL "team" table — ${TEAM.length} rows`);
}

/* ── run ────────────────────────────────────────────────────────────────── */

try {
  console.log("\n  Crispo — migrate\n");
  await migrate();
  await seedUsers();
  await pruneLegacyContent();
  await seedContent();
  await seedProducts();
  await seedJobs();
  await seedTeam();
  console.log("\n  Done.\n");
} catch (err) {
  console.error("\n  ✗ Migration failed:", err.message);
  if (err.code === "ECONNREFUSED" || err.message.includes("connect")) {
    console.error("    Is PostgreSQL running? See README for the Docker one-liner.\n");
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
