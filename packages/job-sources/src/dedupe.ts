import type { NormalizedJob } from "./normalize";

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().trim().replace(/\s+/g, " ");

/** Deterministic duplicate key: company + title + location. */
export function computeDuplicateHash(job: { company: string; title: string; location?: string | null }): string {
  return `${norm(job.company)}|${norm(job.title)}|${norm(job.location)}`;
}

/** Naive description similarity (token Jaccard) for near-duplicate detection. */
export function descriptionSimilarity(a: string, b: string): number {
  const ta = new Set(norm(a).split(/\s+/).filter(Boolean));
  const tb = new Set(norm(b).split(/\s+/).filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

export function isDuplicate(a: NormalizedJob, b: NormalizedJob): boolean {
  if (a.url && b.url && a.url === b.url) return true;
  if (a.sourceJobId && b.sourceJobId && a.source === b.source && a.sourceJobId === b.sourceJobId) return true;
  if (computeDuplicateHash(a) === computeDuplicateHash(b)) return true;
  if (descriptionSimilarity(a.description, b.description) > 0.9) return true;
  return false;
}
