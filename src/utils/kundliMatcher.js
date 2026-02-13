import AshtaKoota from "../services/ashtaKoota.service.js";

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

  const ashtaScores = AshtaKoota.calculate(kundliA, kundliB);
  score = ashtaScores.total;

  return {
    allowed: score >= 18,
    score,
    maxScore: 36
  };
};
