import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameBoard } from '../src/GameBoard';
import type { GameState } from '@pauli/shared';

describe('GameBoard', () => {
  it('renders game board with difficulty level', () => {
    const mockOnGameStart = jest.fn();
    render(<GameBoard difficulty={3} onGameStart={mockOnGameStart} />);

    expect(screen.getByText(/Level 3/i)).toBeInTheDocument();
  });

  it('calls onGameStart when button is clicked', async () => {
    const mockOnGameStart = jest.fn();
    render(<GameBoard difficulty={2} onGameStart={mockOnGameStart} />);

    const button = screen.getByRole('button', { name: /Start Game/i });
    fireEvent.click(button);

    expect(mockOnGameStart).toHaveBeenCalled();
  });

  it('passes correct game state to callback', async () => {
    const mockOnGameStart = jest.fn((state: GameState) => {
      expect(state.difficulty).toBe(5);
      expect(state.score).toBe(0);
      expect(state.completed).toBe(false);
    });

    render(<GameBoard difficulty={5} onGameStart={mockOnGameStart} />);

    const button = screen.getByRole('button', { name: /Start Game/i });
    fireEvent.click(button);

    expect(mockOnGameStart).toHaveBeenCalled();
  });
});
