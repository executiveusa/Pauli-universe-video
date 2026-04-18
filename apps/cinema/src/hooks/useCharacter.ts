import { useState, useCallback } from 'react';

export interface Character {
  id: string;
  name: string;
  avatar?: string;
  consistencyScore: number;
  lastSeen?: string;
  soulId?: string;
}

export function useCharacter() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);

  const loadCharacters = useCallback(async () => {
    setIsLoadingCharacters(true);
    try {
      // In production, fetch from API
      const mockCharacters: Character[] = [
        {
          id: 'pauli',
          name: 'Wolfgang Pauli',
          avatar: '👻',
          consistencyScore: 0.95,
          lastSeen: new Date().toISOString(),
          soulId: 'soul-pauli-001',
        },
        {
          id: 'einstein',
          name: 'Albert Einstein',
          avatar: '🔬',
          consistencyScore: 0.87,
          lastSeen: new Date(Date.now() - 3600000).toISOString(),
          soulId: 'soul-einstein-001',
        },
      ];
      setCharacters(mockCharacters);
    } finally {
      setIsLoadingCharacters(false);
    }
  }, []);

  const selectCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character);
  }, []);

  const updateConsistencyScore = useCallback((characterId: string, score: number) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === characterId ? { ...c, consistencyScore: score } : c))
    );
    if (selectedCharacter?.id === characterId) {
      setSelectedCharacter({ ...selectedCharacter, consistencyScore: score });
    }
  }, [selectedCharacter]);

  return {
    characters,
    selectedCharacter,
    isLoadingCharacters,
    loadCharacters,
    selectCharacter,
    updateConsistencyScore,
  };
}
