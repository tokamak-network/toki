// ─── Intent Parser: input text → ParsedIntent ───────────────────────
//
// Priority: intentPatterns → matchKeyword (existing) → null (falls through to AI)
// Runs fully client-side — no network latency.

import { INTENT_PATTERNS, type ParsedIntent } from "./toki-intents";

/**
 * Parse a free-text input into a structured intent.
 * Returns null if no intent matched (caller should fall through to keyword/AI).
 */
export function parseIntent(input: string): ParsedIntent | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(trimmed)) {
        const params = pattern.extractParams ? pattern.extractParams(trimmed) : {};
        return {
          category: pattern.category,
          action: pattern.action,
          params,
          raw: trimmed,
        };
      }
    }
  }

  return null;
}
