export interface CinemaVideoData {
  videoId: string;
  characterId: string;
  url: string;
  duration: number;
  quality: number;
}

const CINEMA_API_URL =
  typeof window !== 'undefined'
    ? '/api/cinema'
    : process.env.CINEMA_API_URL || 'http://localhost:3001/api';

export async function getCinemaVideo(characterId: string): Promise<CinemaVideoData | null> {
  try {
    const response = await fetch(`${CINEMA_API_URL}/videos/${characterId}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch cinema video for character ${characterId}:`, error);
    return null;
  }
}

export async function getRandomCinemaVideo(): Promise<CinemaVideoData | null> {
  try {
    const response = await fetch(`${CINEMA_API_URL}/videos/random`);
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch random cinema video:', error);
    return null;
  }
}

export function isVideoPlayable(video: CinemaVideoData): boolean {
  return !!(video.url && video.duration > 0 && video.quality >= 50);
}

export function getVideoQualityLabel(quality: number): string {
  if (quality >= 90) return '4K';
  if (quality >= 70) return 'Full HD';
  if (quality >= 50) return 'HD';
  return 'SD';
}
