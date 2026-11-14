// Marks the matched words in search excerpts from the database; never present in document text
export const MATCH_START = "\u0001";
export const MATCH_END = "\u0002";

/** Splits a search excerpt into plain and matched parts, for rendering highlights as text. */
export function splitExcerpt(excerpt: string): { text: string; match: boolean }[] {
  const parts: { text: string; match: boolean }[] = [];
  for (const [index, piece] of excerpt.split(MATCH_START).entries()) {
    if (index === 0) {
      if (piece) parts.push({ text: piece, match: false });
      continue;
    }
    const [matched, rest] = piece.split(MATCH_END);
    if (matched) parts.push({ text: matched, match: true });
    if (rest) parts.push({ text: rest, match: false });
  }
  return parts;
}

/** Whether an excerpt highlights a match in the text, rather than only opening the document. */
export const excerptHasMatch = (excerpt: string) => excerpt.includes(MATCH_START);
