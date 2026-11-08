/* ==========================================================================
   Job applications — public multipart POST (CV attached), admin GET.

   The CV lands in server/uploads/ and is served back at /uploads/<name>;
   only the path is stored in the database.
   ========================================================================== */

import { mkdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { Router } from "express";
import multer from "multer";
import { config } from "../config.js";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";
import { genId } from "../lib/ids.js";

export const applicationsRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CV_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const MAX_CV_BYTES = 5 * 1024 * 1024;

mkdirSync(config.uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadsDir,
    filename: (req, file, cb) => {
      const safeOriginal = basename(file.originalname)
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(-80);
      cb(null, `${genId("cv")}-${safeOriginal}`);
    },
  }),
  limits: { fileSize: MAX_CV_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    if (!CV_EXTENSIONS.has(ext)) {
      return cb(new ApiError(400, "CV must be a PDF, DOC or DOCX file."));
    }
    cb(null, true);
  },
});

/* Public: submit an application (optionally with a CV). */
applicationsRouter.post("/", upload.single("cv"), async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim();
    const phone = String(req.body?.phone ?? "").trim() || null;
    const experience = String(req.body?.experience ?? "").trim() || null;
    const role = String(req.body?.role ?? "").trim() || null;
    const link = String(req.body?.link ?? "").trim() || null;
    const cover = String(req.body?.cover ?? "").trim();
    const consent = req.body?.consent === "true" || req.body?.consent === "on" || req.body?.consent === "1";

    if (!name) throw new ApiError(400, "Full name is required.");
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "A valid email address is required.");
    if (!cover) throw new ApiError(400, "Please tell us why you are applying.");
    if (!consent) throw new ApiError(400, "Please agree to store your application.");

    const cvPath = req.file ? `/uploads/${req.file.filename}` : null;

    const id = genId("a");
    await query(
      `INSERT INTO applications (id, name, email, phone, experience, role, link, cover, cv_path, consent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, name, email, phone, experience, role, link, cover, cvPath, true],
    );

    res.status(201).json({ ok: true, id, cv: cvPath });
  } catch (err) {
    next(err);
  }
});

/* Admin: read applications, newest first. */
applicationsRouter.get("/list", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM applications ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});
