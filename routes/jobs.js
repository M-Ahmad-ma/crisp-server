/* ==========================================================================
   Admin job postings CRUD — /api/jobs

   These rows also feed the public careers pages (GET /api/content), so
   every field the public site renders lives here: slug, shift, icon,
   summary, salaries, responsibilities and benefits.
   ========================================================================== */

import { collectionRouter, required, optionalStr, optionalNumber, number } from "./collection.js";
import { ApiError } from "../middleware/errors.js";
import { slugify } from "../lib/slug.js";

function strings(value) {
  return Array.isArray(value) ? value.map(String) : [];
}

function toApi(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    department: row.department,
    location: row.location,
    type: row.type,
    experience: row.experience,
    salaryMin: row.salary_min ?? null,
    salaryMax: row.salary_max ?? null,
    salaryCurrency: row.salary_currency,
    salaryDisplay: row.salary_display,
    status: row.status,
    openings: Number(row.openings),
    applicants: Number(row.applicants),
    shift: row.shift,
    icon: row.icon,
    summary: row.summary,
    description: row.description,
    responsibilities: strings(row.responsibilities),
    requirements: strings(row.requirements),
    benefits: strings(row.benefits),
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

  /* Public URL: derived from the title on create, then stable so links and
     search results don't break when the title is edited. */
  const slug = optionalStr(g("slug")) || slugify(title);

  const salaryMin = optionalNumber(g("salaryMin"), { min: 0, field: "Minimum salary" });
  const salaryMax = optionalNumber(g("salaryMax"), { min: 0, field: "Maximum salary" });

  if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
    throw new ApiError(400, "Maximum salary must be greater than or equal to the minimum.");
  }

  const postedAt = g("postedAt") ? new Date(g("postedAt")) : existing?.postedAt ? new Date(existing.postedAt) : new Date();

  if (postedAt.toString() === "Invalid Date") {
    throw new ApiError(400, "postedAt must be a valid date.");
  }

  return {
    slug,
    title,
    department,
    location,
    type: optionalStr(g("type")),
    experience: optionalStr(g("experience")),
    salaryMin,
    salaryMax,
    salaryCurrency: optionalStr(g("salaryCurrency")) || "USD",
    salaryDisplay: optionalStr(g("salaryDisplay")),
    status: optionalStr(g("status")) || "open",
    openings: number(g("openings"), { fallback: 1, min: 1, field: "Openings" }),
    applicants: number(g("applicants"), { fallback: 0, min: 0, field: "Applicants" }),
    shift: optionalStr(g("shift")),
    icon: optionalStr(g("icon")),
    summary: optionalStr(g("summary")),
    description,
    responsibilities: strings(g("responsibilities")),
    requirements: strings(g("requirements")),
    benefits: strings(g("benefits")),
    postedAt,
  };
}

function toRow(values) {
  return {
    slug: values.slug,
    title: values.title,
    department: values.department,
    location: values.location,
    type: values.type,
    experience: values.experience,
    salary_min: values.salaryMin,
    salary_max: values.salaryMax,
    salary_currency: values.salaryCurrency,
    salary_display: values.salaryDisplay,
    status: values.status,
    openings: values.openings,
    applicants: values.applicants,
    shift: values.shift,
    icon: values.icon,
    summary: values.summary,
    description: values.description,
    responsibilities: JSON.stringify(values.responsibilities),
    requirements: JSON.stringify(values.requirements),
    benefits: JSON.stringify(values.benefits),
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
