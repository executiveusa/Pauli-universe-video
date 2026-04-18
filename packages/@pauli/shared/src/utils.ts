export function calculateUDECAverage(scores: {
  mot: number;
  acc: number;
  typ: number;
  clr: number;
  spd: number;
  rsp: number;
  cod: number;
  arc: number;
  dep: number;
  doc: number;
  err: number;
  prf: number;
  sec: number;
  ux: number;
}): number {
  const values = Object.values(scores);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function formatCost(costUSD: number): string {
  return `$${costUSD.toFixed(2)}`;
}

export function calculateGameScore(
  baseScore: number,
  difficulty: number,
  hintsUsed: number
): number {
  const difficultyMultiplier =
    {
      1: 1,
      2: 1.5,
      3: 2,
      4: 2.5,
      5: 3,
      6: 3.5,
      7: 4,
      8: 4.5,
      9: 5,
    }[difficulty] || 1;
  const hintPenalty = hintsUsed * 10;
  return Math.max(0, Math.round(baseScore * difficultyMultiplier - hintPenalty));
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
