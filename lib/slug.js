/* ==========================================================================
   slugify — turn a display label into the id form the public site uses.

   The admin tables store human labels ("Flavour & R&D", "Cheesy"); the
   public pages filter on ids ("flavour-r-d", "cheesy"). Both sides derive
   the id from the same label, so they always agree.
   ========================================================================== */

export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents: Tomás → tomas
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
