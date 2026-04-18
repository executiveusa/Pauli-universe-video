import React, { useState, useCallback } from 'react';
import type { GameState } from '@pauli/shared';

export interface GameBoardProps {
  difficulty: number;
  onGameStart: (gameState: GameState) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ difficulty, onGameStart }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = useCallback(async () => {
    setIsLoading(true);
    try {
      const gameState: GameState = {
        id: crypto.randomUUID(),
        userId: 'test-user',
        difficulty: difficulty as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
        score: 0,
        hintsUsed: 0,
        completed: false,
        createdAt: new Date(),
      };
      onGameStart(gameState);
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, onGameStart]);

  return (
    <div className="game-board">
      <h1>Where&apos;s Pauli? - Level {difficulty}</h1>
      <button onClick={handleStartGame} disabled={isLoading}>
        {isLoading ? 'Starting...' : 'Start Game'}
      </button>
    </div>
  );
};
