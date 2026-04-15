import React, { useState } from 'react';

export interface GuessingSystemProps {
  movieTitle: string;
  onGuess: (guess: string) => Promise<boolean>;
}

export const GuessingSystem: React.FC<GuessingSystemProps> = ({
  movieTitle: _movieTitle,
  onGuess,
}) => {
  const [guess, setGuess] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmitGuess = async () => {
    if (!guess.trim()) return;

    setIsChecking(true);
    try {
      const isCorrect = await onGuess(guess);
      setFeedback(isCorrect ? 'Correct!' : 'Incorrect, try again!');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="guessing-system">
      <p>Guess which movie Pauli is hiding in:</p>
      <input
        type="text"
        value={guess}
        onChange={(e) => setGuess(e.target.value)}
        placeholder="Enter movie title"
        disabled={isChecking}
      />
      <button onClick={handleSubmitGuess} disabled={isChecking || !guess.trim()}>
        {isChecking ? 'Checking...' : 'Submit Guess'}
      </button>
      {feedback && <p>{feedback}</p>}
    </div>
  );
};
