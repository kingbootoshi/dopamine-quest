export function calcXP(impact: number, complexity: number, streak: number) {
  const base = impact * complexity * 3;
  const bonus = 1 + Math.min(streak, 7) * 0.05;
  const randomness = 0.9 + Math.random() * 0.2;
  return Math.round(base * bonus * randomness);
}