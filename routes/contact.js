/* ==========================================================================
   Contact form submissions — public POST, admin GET.
   ========================================================================== */

import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";
import { genId } from "../lib/ids.js";

export const contactRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Public: send a message from the site's contact form. */
contactRouter.post("/", async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim();
    const topic = String(req.body?.topic ?? "").trim() || null;
    const message = String(req.body?.message ?? "").trim();

    if (!name) throw new ApiError(400, "Name is required.");
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "A valid email address is required.");
    if (!message) throw new ApiError(400, "Message is required.");
    if (message.length > 5000) throw new ApiError(400, "Message is too long (max 5000 characters).");

    const id = genId("m");
    await query(
      "INSERT INTO contact_messages (id, name, email, topic, message) VALUES ($1, $2, $3, $4, $5)",
      [id, name, email, topic, message],
    );

    res.status(201).json({ ok: true, id });
  } catch (err) {
    next(err);
  }
});

/* Admin: read the inbox. */
contactRouter.get("/messages", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});
