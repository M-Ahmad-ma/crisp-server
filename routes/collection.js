/* ==========================================================================
   Generic collection CRUD for the admin console. The shape mirrors what
   admin/lib/store.js used to do against localStorage:

     list()  -> GET    /api/<collection>
     get(id) -> GET    /api/<collection>/:id
     create  -> POST   /api/<collection>
     update  -> PUT    /api/<collection>/:id
     remove  -> DELETE /api/<collection>/:id

   `rowToApi` converts DB rows (snake_case, NUMERIC-as-string) into the
   camelCase, plain-number JSON the admin UI expects.
   ========================================================================== */

import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";
import { genId } from "../lib/ids.js";

/**
 * @param {object} options
 * @param {string} options.table        table name (trusted, never user input)
 * @param {string} options.idPrefix     id prefix, e.g. "p"
 * @param {string[]} options.columns    snake_case columns the API exposes
 * @param {(input: object) => object} options.toApi      row -> API shape
 * @param {(body: object, existing: object|null) => object} options.validate
 * @param {(body: object) => object} [options.toRow]    API body -> row values
 */
export function collectionRouter({ table, idPrefix, columns, toApi, validate, toRow = (b) => b }) {
  const router = Router();

  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const { rows } = await query(`SELECT * FROM ${table} ORDER BY created_at DESC, id DESC`);
      res.json(rows.map(toApi));
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const { rows } = await query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!rows[0]) throw new ApiError(404, "Not found.");
      res.json(toApi(rows[0]));
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const values = validate(req.body ?? {}, null);
      const row = { ...toRow(values), id: genId(idPrefix) };

      const keys = Object.keys(row);
      const params = keys.map((_, i) => `$${i + 1}`);

      const { rows } = await query(
        `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${params.join(", ")}) RETURNING *`,
        keys.map((k) => row[k]),
      );

      res.status(201).json(toApi(rows[0]));
    } catch (err) {
      next(err);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      const { rows } = await query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      const existing = rows[0];
      if (!existing) throw new ApiError(404, "Not found.");

      const values = validate(req.body ?? {}, toApi(existing));
      const row = { ...toRow(values), id: existing.id, created_at: existing.created_at };

      const keys = Object.keys(row);
      const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);

      const updated = await query(
        `UPDATE ${table} SET ${setClauses.join(", ")}, updated_at = now() WHERE id = $${keys.length + 1} RETURNING *`,
        [...keys.map((k) => row[k]), existing.id],
      );

      res.json(toApi(updated.rows[0]));
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const { rowCount } = await query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
      if (!rowCount) throw new ApiError(404, "Not found.");
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

/* ── shared field helpers ──────────────────────────────────────────────── */

export function str(value, fallback = "") {
  return value === undefined || value === null ? fallback : String(value);
}

export function optionalStr(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

export function number(value, { fallback = 0, min = -Infinity, field = "value" } = {}) {
  const n = value === "" || value === null || value === undefined ? fallback : Number(value);
  if (!Number.isFinite(n)) throw new ApiError(400, `${field} must be a number.`);
  if (n < min) throw new ApiError(400, `${field} must be ${min} or more.`);
  return Math.round(n * 100) / 100;
}

export function optionalNumber(value, { min = -Infinity, field = "value" } = {}) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new ApiError(400, `${field} must be a number.`);
  if (n < min) throw new ApiError(400, `${field} must be ${min} or more.`);
  return Math.round(n);
}

export function required(value, field) {
  const v = str(value).trim();
  if (!v) throw new ApiError(400, `${field} is required.`);
  return v;
}
