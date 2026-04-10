/**
 * SECURITY: CRIT-06 — Sanitize user input for PostgREST filter strings.
 *
 * PostgREST uses a DSL where commas separate filters, dots delimit
 * column.operator.value, and parentheses group expressions.
 * Unsanitized user input in `.or()` strings can inject additional filters.
 *
 * This function strips characters that have special meaning in PostgREST
 * filter syntax, making the string safe for use in `.ilike` patterns.
 */
export function sanitizeSearchTerm(input: string): string {
  // Remove characters that can break out of `.or()` filter strings:
  //  , (separates filters)  . (separates column.op.value)
  //  ( ) (grouping)  \ (escape char)  % (wildcard — we add our own)
  return input.replace(/[,.()\\\/%]/g, '')
}
