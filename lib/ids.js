/* ==========================================================================
   Prefixed record ids — same style the admin UI already generates
   (p_…, j_…, t_…) so ids stay short, sortable-ish and readable.
   ========================================================================== */

export function genId(prefix = "r") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
