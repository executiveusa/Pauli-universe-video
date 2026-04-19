import { clamp } from '@pauli/shared';

export interface HidingPosition {
  x: number;
  y: number;
  difficulty: number;
}

export function generateHidingPosition(
  boardWidth: number,
  boardHeight: number,
  difficulty: number
): HidingPosition {
  const minMargin = Math.max(10, 100 - difficulty * 5);

  const x = clamp(
    Math.random() * (boardWidth - minMargin * 2) + minMargin,
    minMargin,
    boardWidth - minMargin
  );

  const y = clamp(
    Math.random() * (boardHeight - minMargin * 2) + minMargin,
    minMargin,
    boardHeight - minMargin
  );

  return { x, y, difficulty };
}

export function isWithinClickZone(
  clickX: number,
  clickY: number,
  targetX: number,
  targetY: number,
  difficulty: number
): boolean {
  const tolerance = Math.max(10, 50 - difficulty * 3);
  const distance = Math.sqrt(Math.pow(clickX - targetX, 2) + Math.pow(clickY - targetY, 2));
  return distance <= tolerance;
}

export function calculateDifficultyLevel(level: number): {
  hidingSize: number;
  moveFrequency: number;
  timeLimit: number;
} {
  return {
    hidingSize: Math.max(20, 100 - level * 8),
    moveFrequency: 500 + level * 100,
    timeLimit: Math.max(30, 180 - level * 15),
  };
}
