/**
 * Review Similarity and Duplicate Detection Utility
 * Compares newly generated reviews against session history to ensure
 * genuine uniqueness and zero near-duplicates.
 */

function cleanTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ') // Preserve English & Devanagari (Marathi) words
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function getWordBigrams(tokens: string[]): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return bigrams;
}

/**
 * Calculates similarity coefficient between two review strings (0.0 to 1.0).
 * Uses combined word overlap (Jaccard) and bigram overlap (Dice) + sentence check.
 */
export function calculateReviewSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const strA = a.trim();
  const strB = b.trim();
  if (strA === strB) return 1.0;

  const tokensA = cleanTokens(strA);
  const tokensB = cleanTokens(strB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  // Unigram overlap
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let tokenIntersection = 0;
  for (const t of setA) {
    if (setB.has(t)) tokenIntersection++;
  }
  const tokenUnion = new Set([...setA, ...setB]).size;
  const unigramJaccard = tokenUnion > 0 ? tokenIntersection / tokenUnion : 0;

  // Bigram overlap
  const bigramsA = getWordBigrams(tokensA);
  const bigramsB = getWordBigrams(tokensB);
  let bigramIntersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) bigramIntersection++;
  }
  const totalBigrams = bigramsA.size + bigramsB.size;
  const bigramDice = totalBigrams > 0 ? (2 * bigramIntersection) / totalBigrams : 0;

  // Exact sentence sharing penalty
  const sentencesA = strA.split(/[.!?\n]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 15);
  const sentencesB = strB.split(/[.!?\n]+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 15);
  let sharedSentence = false;
  for (const sA of sentencesA) {
    for (const sB of sentencesB) {
      if (sA === sB) {
        sharedSentence = true;
        break;
      }
    }
    if (sharedSentence) break;
  }

  // Combined score with higher weight on bigram phrase structure
  const combined = unigramJaccard * 0.4 + bigramDice * 0.6;
  return sharedSentence ? Math.max(combined, 0.65) : combined;
}

/**
 * Checks if a candidate review is too similar to any review generated earlier in the session.
 * Threshold defaults to 0.38 (38% structural/vocabulary overlap).
 */
export function isReviewTooSimilar(
  candidate: string,
  history: string[],
  threshold = 0.38
): { isDuplicate: boolean; maxSimilarity: number; matchedReview?: string } {
  if (!history || history.length === 0) {
    return { isDuplicate: false, maxSimilarity: 0 };
  }

  let maxSim = 0;
  let matched: string | undefined;

  for (const prev of history) {
    const sim = calculateReviewSimilarity(candidate, prev);
    if (sim > maxSim) {
      maxSim = sim;
      matched = prev;
    }
  }

  return {
    isDuplicate: maxSim >= threshold,
    maxSimilarity: maxSim,
    matchedReview: matched,
  };
}
