/* ==========================================================================
   Admin product catalog CRUD — /api/products
   ========================================================================== */

import { collectionRouter, required, optionalStr, number } from "./collection.js";

function toApi(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    flavor: row.flavor,
    price: Number(row.price),
    weight: row.weight,
    stock: Number(row.stock),
    status: row.status,
    description: row.description,
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validate(body, existing) {
  const g = (key) => (body[key] !== undefined ? body[key] : existing?.[key]);

  const name = required(g("name"), "Name");
  const category = required(g("category"), "Category");

  return {
    name,
    slug: optionalStr(g("slug")) || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    category,
    flavor: optionalStr(g("flavor")),
    price: number(g("price"), { min: 0, field: "Price" }),
    weight: optionalStr(g("weight")),
    stock: number(g("stock"), { min: 0, field: "Stock" }),
    status: optionalStr(g("status")) || "active",
    description: optionalStr(g("description")),
    image: optionalStr(g("image")),
  };
}

export const productsRouter = collectionRouter({
  table: "products",
  idPrefix: "p",
  toApi,
  validate,
});
