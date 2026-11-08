/* ==========================================================================
   JWT issue / verify. Stateless: the token carries the user id, and every
   protected route re-reads the user from the database so a deleted or
   disabled account stops working immediately.
   ========================================================================== */

import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signToken(user, { remember = false } = {}) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: remember ? config.jwtRememberExpiresIn : config.jwtExpiresIn },
  );
}

/** Returns the decoded payload, or null when the token is invalid/expired. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}
