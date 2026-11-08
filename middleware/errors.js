/* ==========================================================================
   Error handling — a small ApiError for expected failures plus a
   catch-all so every error answers with JSON instead of an HTML stack
   trace.
   ========================================================================== */

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Not found." });
}

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, next) {
  // Multer: file too large
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "That file is too large (max 5 MB)." });
  }

  if (err instanceof ApiError || err?.expose) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  // Malformed JSON body
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body." });
  }

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: "Something went wrong on our end. Please try again." });
}
