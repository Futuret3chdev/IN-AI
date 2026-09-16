export function chunkText(text: string, size = 1200, overlap = 160) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + size));
    i += Math.max(1, size - overlap);
  }
  return chunks;
}

export function ftsQuery(raw: string) {
  const tokens = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .slice(0, 8);
  if (!tokens.length) return null;
  return tokens.map((t) => `"${t}"`).join(" OR ");
}

export function titleFrom(text: string, fallback = "Untitled") {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return fallback;
  return t.length > 64 ? `${t.slice(0, 61)}…` : t;
}

export function now() {
  return Date.now();
}
