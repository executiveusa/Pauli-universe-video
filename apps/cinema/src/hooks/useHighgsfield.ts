import { useState, useCallback } from 'react';

export interface SoulID {
  id: string;
  characterId: string;
  referenceImages: string[];
  consistencyScore: number;
  cachedAt: string;
  expiresAt: string;
}

export function useHighgsfield() {
  const [soulIds, setSoulIds] = useState<Map<string, SoulID>>(new Map());
  const [isTraining, setIsTraining] = useState(false);
  const [consistencyScores, setConsistencyScores] = useState<Map<string, number>>(new Map());

  const generateSoulId = useCallback(async (characterId: string, referenceImages: string[]) => {
    setIsTraining(true);
    try {
      // Check cache first
      const cached = soulIds.get(characterId);
      const now = new Date();

      if (cached && new Date(cached.expiresAt) > now) {
        return cached;
      }

      // In production, call Higgsfield API
      // For now, generate a mock Soul ID
      const soulId: SoulID = {
        id: `soul-${characterId}-${Date.now()}`,
        characterId,
        referenceImages,
        consistencyScore: 0.95 + Math.random() * 0.05,
        cachedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };

      setSoulIds((prev) => new Map(prev).set(characterId, soulId));
      return soulId;
    } finally {
      setIsTraining(false);
    }
  }, [soulIds]);

  const validateConsistency = useCallback(
    async (characterId: string, videoFrames: string[]): Promise<number> => {
      try {
        const soulId = soulIds.get(characterId);
        if (!soulId) {
          throw new Error('Soul ID not found. Generate it first.');
        }

        // In production, call Higgsfield API to validate
        // For now, return a mock consistency score
        const score = 0.85 + Math.random() * 0.15;
        setConsistencyScores((prev) => new Map(prev).set(characterId, score));

        return score;
      } catch (error) {
        console.error('Consistency validation failed:', error);
        return 0;
      }
    },
    [soulIds]
  );

  const getSoulId = useCallback(
    (characterId: string): SoulID | undefined => {
      return soulIds.get(characterId);
    },
    [soulIds]
  );

  const getConsistencyScore = useCallback(
    (characterId: string): number | undefined => {
      return consistencyScores.get(characterId);
    },
    [consistencyScores]
  );

  const clearCache = useCallback((characterId?: string) => {
    if (characterId) {
      setSoulIds((prev) => {
        const newMap = new Map(prev);
        newMap.delete(characterId);
        return newMap;
      });
    } else {
      setSoulIds(new Map());
    }
  }, []);

  return {
    soulIds,
    isTraining,
    consistencyScores,
    generateSoulId,
    validateConsistency,
    getSoulId,
    getConsistencyScore,
    clearCache,
  };
}
