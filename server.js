/* ==========================================================================
   Crispo server — Express API + static host for the built React site.

     /api/*      REST endpoints (auth, content, admin CRUD, form posts)
     /uploads/   CV files
     /*          react-project/dist with an SPA fallback

   Usage:  npm run dev     (watch mode, port 4000)
           npm start       (production)
   ========================================================================== */

import { existsSync } from "node:fs";
import { join } from "node:path";
import express from "express";
import cors from "cors";

import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { contentRouter } from "./routes/content.js";
import { productsRouter } from "./routes/products.js";
import { jobsRouter } from "./routes/jobs.js";
import { teamRouter } from "./routes/team.js";
import { contactRouter } from "./routes/contact.js";
import { applicationsRouter } from "./routes/applications.js";
import { notFoundHandler, errorHandler } from "./middleware/errors.js";

const app = express();

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  next();
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* ── API ──────────────────────────────────────────────────────────────── */

app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use("/api/auth", authRouter);
app.use("/api/content", contentRouter);
app.use("/api/products", productsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/team", teamRouter);
app.use("/api/contact", contactRouter);
app.use("/api/applications", applicationsRouter);

/* Unknown API paths must answer JSON, never the SPA shell. */
app.use("/api", notFoundHandler);

/* ── Uploaded CVs ─────────────────────────────────────────────────────── */

app.use("/uploads", express.static(config.uploadsDir, { fallthrough: true }));
app.use("/uploads", (req, res) => res.status(404).json({ error: "File not found." }));

/* ── Built React site (SPA fallback) ──────────────────────────────────── */

const indexHtml = join(config.distDir, "index.html");

if (existsSync(indexHtml)) {
  app.use(express.static(config.distDir));
  app.get("*", (req, res) => res.sendFile(indexHtml));
} else {
  app.get("*", (req, res) => {
    res
      .status(503)
      .send("The site has not been built yet. Run: cd react-project && npm run build");
  });
}

/* ── Errors ───────────────────────────────────────────────────────────── */

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`\n  Crispo server running`);
  console.log(`  → http://localhost:${config.port}`);
  console.log(`  → API      http://localhost:${config.port}/api`);
  console.log(`  → site     ${existsSync(indexHtml) ? config.distDir : "(not built yet — run npm run build in react-project)"}`);
  console.log(`  → uploads  ${config.uploadsDir}\n`);
});
