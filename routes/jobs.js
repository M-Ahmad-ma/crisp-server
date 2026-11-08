/* ==========================================================================
   Admin job postings CRUD — /api/jobs
   ========================================================================== */

import { collectionRouter, required, optionalStr, optionalNumber, number } from "./collection.js";
import { ApiError } from "../middleware/errors.js";

function toApi(row) {
  return {
    id: row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    type: row.type,
    experience: row.experience,
    salaryMin: row.salary_min ?? null,
    salaryMax: row.salary_max ?? null,
    salaryCurrency: row.salary_currency,
    status: row.status,
    openings: Number(row.openings),
    applicants: Number(row.applicants),
    description: row.description,
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    postedAt: row.posted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validate(body, existing) {
  const g = (key) => (body[key] !== undefined ? body[key] : existing?.[key]);

  const title = required(g("title"), "Job title");
  const department = required(g("department"), "Department");
  const location = required(g("location"), "Location");
  const description = required(g("description"), "Description");

  const salaryMin = optionalNumber(g("salaryMin"), { min: 0, field: "Minimum salary" });
  const salaryMax = optionalNumber(g("salaryMax"), { min: 0, field: "Maximum salary" });

  if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
    throw new ApiError(400, "Maximum salary must be greater than or equal to the minimum.");
  }

  const requirements = g("requirements");
  const postedAt = g("postedAt") ? new Date(g("postedAt")) : existing?.postedAt ? new Date(existing.postedAt) : new Date();

  if (postedAt.toString() === "Invalid Date") {
    throw new ApiError(400, "postedAt must be a valid date.");
  }

  return {
    title,
    department,
    location,
    type: optionalStr(g("type")),
    experience: optionalStr(g("experience")),
    salaryMin,
    salaryMax,
    salaryCurrency: optionalStr(g("salaryCurrency")) || "PKR",
    status: optionalStr(g("status")) || "open",
    openings: number(g("openings"), { fallback: 1, min: 1, field: "Openings" }),
    applicants: number(g("applicants"), { fallback: 0, min: 0, field: "Applicants" }),
    description,
    requirements: Array.isArray(requirements) ? requirements.map(String) : [],
    postedAt,
  };
}

function toRow(values) {
  return {
    title: values.title,
    department: values.department,
    location: values.location,
    type: values.type,
    experience: values.experience,
    salary_min: values.salaryMin,
    salary_max: values.salaryMax,
    salary_currency: values.salaryCurrency,
    status: values.status,
    openings: values.openings,
    applicants: values.applicants,
    description: values.description,
    requirements: JSON.stringify(values.requirements),
    posted_at: values.postedAt,
  };
}

export const jobsRouter = collectionRouter({
  table: "jobs",
  idPrefix: "j",
  toApi,
  validate,
  toRow,
});
