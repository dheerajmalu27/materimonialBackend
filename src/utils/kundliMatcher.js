export const matchKundli = (kundliA, kundliB) => {
  let score = 0;

  // ⚠️ Manglik rule
  if (kundliA.manglik !== kundliB.manglik) {
    return {
      allowed: false,
      reason: 'Manglik mismatch',
      score: 0
    };
  }

  // 🔮 Dummy logic (replace with astrology lib later)
  if (kundliA.nakshatra === kundliB.nakshatra) score += 8;
  if (kundliA.moonSign === kundliB.moonSign) score += 6;

  score += 10; // Assume partial match for other gunas

  return {
    allowed: score >= 18,
    score,
    maxScore: 36
  };
};
