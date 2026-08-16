export const MAX_TOKENS = 14;

/** Word/punctuation-level "tokenizer" — not real BPE, but enough to make
 * the tokenization concept concrete: splitting text into discrete units
 * that get their own embedding. Real subword tokenization is out of scope
 * here (spec 11.5: don't implement every variant); the point is the
 * pipeline downstream of tokenization. */
export function tokenize(text: string): string[] {
  const matches = text.trim().toLowerCase().match(/[\w']+|[.,!?;:"()]/g) ?? [];
  return matches.slice(0, MAX_TOKENS);
}
