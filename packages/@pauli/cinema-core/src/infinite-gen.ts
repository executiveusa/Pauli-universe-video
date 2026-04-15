import axios from 'axios';

const STABLE_VIDEO_API_URL = process.env.STABLE_VIDEO_API_URL || 'https://api.stability.ai';

export interface InfinityRequest {
  videoId: string;
  initialVideo: string;
  targetDuration: number;
  stylePrompt: string;
}

export interface InfinityResponse {
  extendedVideoId: string;
  totalDuration: number;
  segments: number;
  cost: number;
}

export async function extendVideoInfinity(request: InfinityRequest): Promise<InfinityResponse> {
  try {
    const response = await axios.post(
      `${STABLE_VIDEO_API_URL}/extend`,
      {
        videoId: request.videoId,
        initialVideo: request.initialVideo,
        targetDuration: request.targetDuration,
        stylePrompt: request.stylePrompt,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STABLE_VIDEO_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      extendedVideoId: response.data.extendedVideoId,
      totalDuration: response.data.totalDuration,
      segments: response.data.segments,
      cost: response.data.cost,
    };
  } catch (error) {
    console.error('Stable Video Infinity extension failed:', error);
    throw new Error('Could not extend video infinitely');
  }
}

export function calculateInfinitySegments(
  targetDuration: number,
  segmentDuration: number = 10
): number {
  return Math.ceil(targetDuration / segmentDuration);
}

export function validateInfinityRequest(request: InfinityRequest): boolean {
  if (!request.videoId || !request.initialVideo) return false;
  if (request.targetDuration < 10 || request.targetDuration > 3600) return false;
  if (!request.stylePrompt || request.stylePrompt.length < 5) return false;
  return true;
}

export async function batchExtendVideos(requests: InfinityRequest[]): Promise<InfinityResponse[]> {
  const results: InfinityResponse[] = [];

  for (const request of requests) {
    if (!validateInfinityRequest(request)) {
      console.warn(`Invalid infinity request for video ${request.videoId}`);
      continue;
    }

    try {
      const result = await extendVideoInfinity(request);
      results.push(result);
    } catch (error) {
      console.error(`Failed to extend video ${request.videoId}:`, error);
    }
  }

  return results;
}
