export const TOKENS = {
  SKILL_ID: "SKILL_ID_PLACEHOLDER",
  CATEGORY: "CATEGORY_PLACEHOLDER",
} as const;

export type TokenKey = (typeof TOKENS)[keyof typeof TOKENS];

/**
 * Returns the replacement map for a given category + name pair.
 * Pass this to applyTokens to swap all placeholders in a template file.
 */
export function buildTokenValues(
  category: string,
  name: string,
): Record<string, string> {
  return {
    [TOKENS.SKILL_ID]: name,
    [TOKENS.CATEGORY]: category,
  };
}

/**
 * Replaces every key in `values` with its corresponding value in `text`.
 * Deterministic: iterates entries in insertion order.
 */
export function applyTokens(
  text: string,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (acc, [token, value]) => acc.replaceAll(token, value),
    text,
  );
}
