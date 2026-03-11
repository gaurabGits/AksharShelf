const DEFAULT_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "he",
  "her",
  "his",
  "i",
  "in",
  "is",
  "it",
  "its",
  "me",
  "my",
  "not",
  "of",
  "on",
  "or",
  "our",
  "she",
  "so",
  "that",
  "the",
  "their",
  "them",
  "there",
  "they",
  "this",
  "to",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "will",
  "with",
  "you",
  "your",
]);

function normalizeText(value) {
  if (!value) return "";
  return String(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const text = normalizeText(value);
  if (!text) return new Set();
  const parts = text.split(" ");
  const tokens = new Set();
  for (const token of parts) {
    if (!token) continue;
    if (token.length < 3) continue;
    if (DEFAULT_STOPWORDS.has(token)) continue;
    tokens.add(token);
  }
  return tokens;
}

function binaryCosineLikeScore(tokensA, tokensB) {
  if (!tokensA?.size || !tokensB?.size) return 0;
  let intersection = 0;
  const [small, big] = tokensA.size < tokensB.size ? [tokensA, tokensB] : [tokensB, tokensA];
  for (const token of small) {
    if (big.has(token)) intersection += 1;
  }
  if (intersection === 0) return 0;
  return intersection / Math.sqrt(tokensA.size * tokensB.size);
}

function eqNormalized(a, b) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na || !nb) return false;
  return na === nb;
}

function computeContentBasedSimilarity(targetBook, candidateBook) {
  const categoryMatch = eqNormalized(targetBook.category, candidateBook.category);
  const authorMatch = eqNormalized(targetBook.author, candidateBook.author);

  const targetTokens = tokenize(
    `${targetBook.title || ""} ${targetBook.description || ""} ${targetBook.category || ""} ${targetBook.author || ""}`
  );
  const candidateTokens = tokenize(
    `${candidateBook.title || ""} ${candidateBook.description || ""} ${candidateBook.category || ""} ${
      candidateBook.author || ""
    }`
  );
  const textScore = binaryCosineLikeScore(targetTokens, candidateTokens);

  const score = (categoryMatch ? 0.55 : 0) + (authorMatch ? 0.25 : 0) + 0.2 * textScore;

  const reasons = [];
  if (categoryMatch) reasons.push("Same category");
  if (authorMatch) reasons.push("Same author");
  if (!categoryMatch && !authorMatch && textScore > 0.15) reasons.push("Similar description");

  return {
    score,
    reasons,
    breakdown: {
      categoryMatch,
      authorMatch,
      textScore,
    },
  };
}

module.exports = {
  computeContentBasedSimilarity,
};

