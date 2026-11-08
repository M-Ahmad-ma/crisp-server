/* ==========================================================================
   migrate.js — create the schema (idempotent) and seed it.

   Seeding rules:
     • admin user  → only when the users table is empty
     • content     → INSERT per domain, never overwrites an existing row
     • products/jobs/team → only when the table is empty

   So re-running `npm run db:migrate` is always safe.

   Usage: npm run db:migrate
   ========================================================================== */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { query, pool } from "./pool.js";
import { config } from "../config.js";
import { hashPassword } from "../lib/passwords.js";

/* ── the frontend's own data modules stay the single source of truth ──── */

import * as site from "../../react-project/src/data/site.js";
import * as productsData from "../../react-project/src/data/products.js";
import * as flavors from "../../react-project/src/data/flavors.js";
import * as about from "../../react-project/src/data/about.js";
import * as recipes from "../../react-project/src/data/recipes.js";
import * as stores from "../../react-project/src/data/stores.js";
import * as contact from "../../react-project/src/data/contact.js";
import * as jobsData from "../../react-project/src/data/jobs.js";
import * as teamData from "../../react-project/src/data/team.js";

import { MOCK_PRODUCTS, MOCK_JOBS, MOCK_TEAM } from "../../react-project/src/admin/lib/mockData.js";

/** Every exported value of a module, minus functions (helpers). */
function exportsOf(mod) {
  return Object.fromEntries(
    Object.entries(mod).filter(([key, value]) => key !== "default" && typeof value !== "function"),
  );
}

const CONTENT = {
  site: exportsOf(site),
  products: exportsOf(productsData),
  flavors: exportsOf(flavors),
  about: exportsOf(about),
  recipes: exportsOf(recipes),
  stores: exportsOf(stores),
  contact: exportsOf(contact),
  jobs: exportsOf(jobsData),
  team: exportsOf(teamData),
};

/* ── migrate ────────────────────────────────────────────────────────────── */

async function migrate() {
  const schema = readFileSync(fileURLToPath(new URL("./schema.sql", import.meta.url)), "utf8");
  await query(schema);
  console.log("  ✓ schema up to date");
}

async function seedUsers() {
  const { rows } = await query("SELECT count(*)::int AS n FROM users");
  if (rows[0].n > 0) {
    console.log("  • users already seeded — skipped");
    return;
  }

  const id = `u_${Date.now().toString(36)}`;
  const passwordHash = await hashPassword(config.admin.password);

  await query(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, 'admin')",
    [id, config.admin.email, passwordHash, config.admin.name],
  );

  console.log(`  ✓ admin user seeded (${config.admin.email})`);
}

async function seedContent() {
  let seeded = 0;

  for (const [domain, data] of Object.entries(CONTENT)) {
    const { rowCount } = await query(
      "INSERT INTO content (domain, data) VALUES ($1, $2::jsonb) ON CONFLICT (domain) DO NOTHING",
      [domain, JSON.stringify(data)],
    );
    seeded += rowCount;
  }

  console.log(`  ✓ content: ${seeded} domain(s) seeded, ${Object.keys(CONTENT).length - seeded} already present`);
}

async function seedProducts() {
  const { rows } = await query("SELECT count(*)::int AS n FROM products");
  if (rows[0].n > 0) {
    console.log("  • products already seeded — skipped");
    return;
  }

  for (const p of MOCK_PRODUCTS) {
    await query(
      `INSERT INTO products (id, name, slug, category, flavor, price, weight, stock, status, description, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
      [
        p.id,
        p.name,
        p.slug ?? null,
        p.category ?? null,
        p.flavor ?? null,
        p.price ?? 0,
        p.weight ?? null,
        p.stock ?? 0,
        p.status ?? "active",
        p.description ?? null,
        p.image || null,
      ],
    );
  }

  console.log(`  ✓ products: ${MOCK_PRODUCTS.length} seeded`);
}

async function seedJobs() {
  const { rows } = await query("SELECT count(*)::int AS n FROM jobs");
  if (rows[0].n > 0) {
    console.log("  • jobs already seeded — skipped");
    return;
  }

  for (const j of MOCK_JOBS) {
    await query(
      `INSERT INTO jobs (id, title, department, location, type, experience, salary_min, salary_max,
                         salary_currency, status, openings, applicants, description, requirements, posted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15)
       ON CONFLICT (id) DO NOTHING`,
      [
        j.id,
        j.title,
        j.department ?? null,
        j.location ?? null,
        j.type ?? null,
        j.experience ?? null,
        j.salaryMin ?? null,
        j.salaryMax ?? null,
        j.salaryCurrency ?? "PKR",
        j.status ?? "open",
        j.openings ?? 1,
        j.applicants ?? 0,
        j.description ?? null,
        JSON.stringify(j.requirements ?? []),
        j.postedAt ? new Date(j.postedAt) : new Date(),
      ],
    );
  }

  console.log(`  ✓ jobs: ${MOCK_JOBS.length} seeded`);
}

async function seedTeam() {
  const { rows } = await query("SELECT count(*)::int AS n FROM team");
  if (rows[0].n > 0) {
    console.log("  • team already seeded — skipped");
    return;
  }

  for (const t of MOCK_TEAM) {
    await query(
      `INSERT INTO team (id, name, role, email, phone, department, status, bio, avatar, joined_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
      [
        t.id,
        t.name,
        t.role ?? null,
        t.email ?? null,
        t.phone ?? null,
        t.department ?? null,
        t.status ?? "active",
        t.bio ?? null,
        t.avatar || null,
        t.joinedAt ? new Date(t.joinedAt) : null,
      ],
    );
  }

  console.log(`  ✓ team: ${MOCK_TEAM.length} seeded`);
}

/* ── run ────────────────────────────────────────────────────────────────── */

try {
  console.log("\n  Crispo — migrate\n");
  await migrate();
  await seedUsers();
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
