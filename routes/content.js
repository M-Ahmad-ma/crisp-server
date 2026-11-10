/* ==========================================================================
   Public content API.

   Single source of truth: products, jobs and team are read straight from
   their admin tables (the same rows /api/products, /api/jobs and /api/team
   edit). The `content` table keeps only the page copy that has no admin
   CRUD screen (navigation, recipes, stores, contact copy, …).

   So an edit in the admin console appears on the public site immediately —
   there is no second copy to keep in sync.
   ========================================================================== */

import { Router } from "express";
import { query } from "../db/pool.js";
import { slugify } from "../lib/slug.js";

export const contentRouter = Router();

const DOMAINS = new Set([
  "site",
  "products",
  "flavors",
  "about",
  "recipes",
  "stores",
  "contact",
  "jobs",
  "team",
]);

/* ── helpers ─────────────────────────────────────────────────────────── */

function initials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function strings(value) {
  return Array.isArray(value) ? value.map(String) : [];
}

/* Pretty fallback for jobs created in the admin without a salary_display. */
function formatSalary(row) {
  const prefix = { USD: "$", PKR: "Rs ", AED: "AED " }[row.salary_currency] ?? `${row.salary_currency ?? ""} `;
  const short = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

  const min = row.salary_min == null ? null : Number(row.salary_min);
  const max = row.salary_max == null ? null : Number(row.salary_max);

  if (min == null && max == null) return "Negotiable";
  if (min != null && max != null) return `${prefix}${short(min)} – ${prefix}${short(max)}`;
  return `${prefix}${short(min ?? max)}`;
}

async function contentMap() {
  const { rows } = await query("SELECT domain, data FROM content");
  const map = {};
  for (const row of rows) map[row.domain] = row.data;
  return map;
}

/* ── public shapes composed from the admin tables ────────────────────── */

async function composeProducts() {
  const { rows } = await query(
    "SELECT * FROM products WHERE status = 'active' ORDER BY created_at ASC, id ASC",
  );

  const categories = [];
  const seen = new Set();

  for (const row of rows) {
    const label = (row.category || "Other").trim();
    const id = slugify(label);
    if (seen.has(id)) continue;
    seen.add(id);
    categories.push({ id, label });
  }

  return {
    CATEGORIES: [{ id: "all", label: "All Flavors" }, ...categories],
    PRODUCTS: rows.map((row) => ({
      id: row.slug || row.id,
      name: row.name,
      description: row.description || "",
      image: row.image || null,
      category: slugify(row.category),
      price: Number(row.price),
    })),
  };
}

async function composeJobs() {
  const { rows } = await query(
    "SELECT * FROM jobs WHERE status = 'open' ORDER BY created_at ASC, id ASC",
  );

  const departments = [];
  const seen = new Set();

  for (const row of rows) {
    const label = (row.department || "Other").trim();
    const id = slugify(label);
    if (seen.has(id)) continue;
    seen.add(id);
    departments.push({ id, label });
  }

  return {
    JOBS: rows.map((row) => ({
      slug: row.slug || slugify(row.title),
      title: row.title,
      department: slugify(row.department),
      type: row.type || "Full-time",
      location: row.location || "",
      shift: row.shift || "",
      salary: row.salary_display || formatSalary(row),
      icon: row.icon || "briefcase",
      summary: row.summary || row.description || "",
      responsibilities: strings(row.responsibilities),
      requirements: strings(row.requirements),
      benefits: strings(row.benefits),
    })),
    JOB_DEPARTMENTS: [{ id: "all", label: "All Roles" }, ...departments],
  };
}

async function composeTeam(teamCopy) {
  const { rows } = await query("SELECT * FROM team ORDER BY created_at ASC, id ASC");
  const ownerRow = rows.find((row) => row.is_owner);

  const TEAM = rows
    .filter((row) => !row.is_owner && row.status === "active")
    .map((row) => ({
      name: row.name,
      role: row.role || "",
      photo: row.avatar || null,
      initials: initials(row.name),
      bio: row.bio || "",
    }));

  /* If the team table has no owner row yet, fall back to the founder copy
     kept in the content table so the About page never loses its hero. */
  const OWNER = ownerRow
    ? {
        name: ownerRow.name,
        role: ownerRow.role || "",
        photo: ownerRow.avatar || null,
        initials: initials(ownerRow.name),
        bio: ownerRow.bio || "",
        quote: ownerRow.quote || "",
        credentials: Array.isArray(ownerRow.credentials) ? ownerRow.credentials : [],
      }
    : (teamCopy?.OWNER ?? null);

  return { OWNER, TEAM };
}

async function composeBundle() {
  const content = await contentMap();

  const [products, jobs, team] = await Promise.all([
    composeProducts(),
    composeJobs(),
    composeTeam(content.team),
  ]);

  const bundle = { ...content };
  bundle.products = products;
  bundle.jobs = { ...(content.jobs ?? {}), ...jobs };
  bundle.team = { ...(content.team ?? {}), ...team };
  return bundle;
}

/* Everything, in one bundle — the client loads this once at boot. */
contentRouter.get("/", async (req, res, next) => {
  try {
    const bundle = await composeBundle();
    res.json(bundle);
  } catch (err) {
    next(err);
  }
});

/* A single domain, e.g. /api/content/recipes */
contentRouter.get("/:domain", async (req, res, next) => {
  try {
    const domain = req.params.domain;

    if (!DOMAINS.has(domain)) {
      return res.status(404).json({ error: `Unknown content domain "${domain}".` });
    }

    if (domain === "products") {
      const data = await composeProducts();
      return res.json(data);
    }

    if (domain === "jobs" || domain === "team") {
      const { rows } = await query("SELECT data FROM content WHERE domain = $1", [domain]);
      const copy = rows[0]?.data;

      if (domain === "jobs") {
        const data = { ...(copy ?? {}), ...(await composeJobs()) };
        return res.json(data);
      }

      const data = { ...(copy ?? {}), ...(await composeTeam(copy)) };
      return res.json(data);
    }

    const { rows } = await query("SELECT data FROM content WHERE domain = $1", [domain]);
    if (!rows[0]) {
      return res.status(404).json({ error: `No content stored for "${domain}".` });
    }

    res.json(rows[0].data);
  } catch (err) {
    next(err);
  }
});
