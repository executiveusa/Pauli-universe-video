import { GAME_CONFIG } from '@pauli/shared';

export interface Hint {
  id: string;
  content: string;
  cost: number;
  revealed: boolean;
}

export function generateHint(movieContext: string, hintLevel: number): Hint {
  const hints: Record<number, string> = {
    1: 'This movie features action sequences.',
    2: 'The main character wears a distinctive outfit.',
    3: 'This film was released in the last decade.',
  };

  return {
    id: `hint-${hintLevel}`,
    content: hints[hintLevel] || 'No more hints available',
    cost: GAME_CONFIG.HINT_COST,
    revealed: false,
  };
}

export function canRequestHint(hintsUsed: number): boolean {
  return hintsUsed < GAME_CONFIG.MAX_HINTS;
}

export function calculateHintScore(hintsUsed: number, baseScore: number): number {
  const hintPenalty = hintsUsed * 10;
  return Math.max(0, baseScore - hintPenalty);
}

export function getHintCost(hintCount: number): number {
  return GAME_CONFIG.HINT_COST * (hintCount + 1);
}
