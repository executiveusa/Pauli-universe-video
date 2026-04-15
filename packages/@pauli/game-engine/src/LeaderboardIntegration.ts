export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  difficulty: number;
  timestamp: Date;
}

const API_BASE_URL =
  typeof window !== 'undefined' ? '/api' : process.env.API_URL || 'http://localhost:3000';

export async function fetchLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
}

export async function submitScore(
  userId: string,
  score: number,
  difficulty: number
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        score,
        difficulty,
        timestamp: new Date(),
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to submit score:', error);
    return false;
  }
}

export async function getUserRank(userId: string): Promise<number | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/rank/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    return data.rank || null;
  } catch (error) {
    console.error('Failed to fetch user rank:', error);
    return null;
  }
}

export function formatLeaderboardEntry(entry: LeaderboardEntry): string {
  return `#${entry.rank} ${entry.username} - ${entry.score} pts (Difficulty ${entry.difficulty})`;
}
