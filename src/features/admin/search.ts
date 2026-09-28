/**
 * Normalizes an admin search box value for a PostgREST `or(... ilike ...)` filter: strips the
 * characters that would break out of the filter syntax and the LIKE wildcards.
 */
export function adminSearchTerm(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  return raw
    .replace(/[%_\\,()"'*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
