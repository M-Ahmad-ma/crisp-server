/* ==========================================================================
   Admin team roster CRUD — /api/team
   ========================================================================== */

import { collectionRouter, required, optionalStr } from "./collection.js";
import { ApiError } from "../middleware/errors.js";

function toApi(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    department: row.department,
    status: row.status,
    bio: row.bio,
    avatar: row.avatar,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validate(body, existing) {
  const g = (key) => (body[key] !== undefined ? body[key] : existing?.[key]);

  const name = required(g("name"), "Name");

  let joinedAt = g("joinedAt") ?? existing?.joinedAt ?? null;
  if (joinedAt) {
    joinedAt = new Date(joinedAt);
    if (joinedAt.toString() === "Invalid Date") {
      throw new ApiError(400, "joinedAt must be a valid date.");
    }
  }

  return {
    name,
    role: optionalStr(g("role")),
    email: optionalStr(g("email")),
    phone: optionalStr(g("phone")),
    department: optionalStr(g("department")),
    status: optionalStr(g("status")) || "active",
    bio: optionalStr(g("bio")),
    avatar: optionalStr(g("avatar")),
    joinedAt,
  };
}

function toRow(values) {
  return {
    name: values.name,
    role: values.role,
    email: values.email,
    phone: values.phone,
    department: values.department,
    status: values.status,
    bio: values.bio,
    avatar: values.avatar,
    joined_at: values.joinedAt,
  };
}

export const teamRouter = collectionRouter({
  table: "team",
  idPrefix: "t",
  toApi,
  validate,
  toRow,
});
