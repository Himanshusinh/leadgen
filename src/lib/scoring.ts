/**
 * Phase 2 — Lead scoring (0-100).
 * A simple, transparent heuristic: the more reachable and reputable a lead,
 * the higher the score. Tune the weights to match what converts for you.
 */
export type ScoreInput = {
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  rating?: number | null;
  reviews?: number | null;
};

export function scoreLead(l: ScoreInput): number {
  let score = 0;

  // Has a contact email (not verified yet — verification is a later phase)
  if (l.email) score += 35;

  if (l.phone) score += 20;
  if (l.website) score += 15;

  // Reputation signals (a real, active business)
  if (l.rating && l.rating >= 4) score += 10;
  else if (l.rating && l.rating >= 3) score += 5;

  if (l.reviews && l.reviews >= 50) score += 15;
  else if (l.reviews && l.reviews >= 10) score += 8;

  return Math.min(100, score);
}
