/** Cosine similarity between two face descriptors (128-dim from face-api). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Default threshold — face-api recommends ~0.6; slightly lower catches more matches. */
export const DEFAULT_MATCH_THRESHOLD = 0.55;

export type FaceMatch = {
  photoId: string;
  score: number;
};

/** Find best match score for a query descriptor against multiple stored descriptors. */
export function bestMatchScore(query: number[], stored: number[][]): number {
  let best = 0;
  for (const desc of stored) {
    const score = cosineSimilarity(query, desc);
    if (score > best) best = score;
  }
  return best;
}

export function findMatches(
  query: number[],
  entries: { photoId: string; descriptors: number[][] }[],
  threshold = DEFAULT_MATCH_THRESHOLD,
): FaceMatch[] {
  const matches: FaceMatch[] = [];
  for (const entry of entries) {
    const score = bestMatchScore(query, entry.descriptors);
    if (score >= threshold) {
      matches.push({ photoId: entry.photoId, score });
    }
  }
  return matches.sort((a, b) => b.score - a.score);
}
