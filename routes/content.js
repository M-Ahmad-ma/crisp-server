/* ==========================================================================
   Public content — the nine domains that used to live as static imports
   in react-project/src/data/*.js, now served from the `content` table.
   ========================================================================== */

import { Router } from "express";
import { query } from "../db/pool.js";

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

/* Everything, in one bundle — the client loads this once at boot. */
contentRouter.get("/", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT domain, data FROM content");
    const bundle = {};
    for (const row of rows) bundle[row.domain] = row.data;
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

    const { rows } = await query("SELECT data FROM content WHERE domain = $1", [domain]);
    if (!rows[0]) {
      return res.status(404).json({ error: `No content stored for "${domain}".` });
    }

    res.json(rows[0].data);
  } catch (err) {
    next(err);
  }
});
