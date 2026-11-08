/* ==========================================================================
   requireAuth — accepts "Bearer <jwt>", verifies it, then loads the user
   from the database (so revoked/deleted accounts cannot keep using an
   old token). Attaches `req.user`.
   ========================================================================== */

import { verifyToken } from "../lib/tokens.js";
import { query } from "../db/pool.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }

    const { rows } = await query("SELECT id, email, name, role FROM users WHERE id = $1", [payload.sub]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Your account no longer exists." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
