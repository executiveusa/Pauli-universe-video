import axios from 'axios';

const HIGGSFIELD_API_URL = process.env.HIGGSFIELD_API_URL || 'https://api.higgsfield.com';
const HIGGSFIELD_API_KEY = process.env.HIGGSFIELD_API_KEY || '';

export interface CharacterConsistencyRequest {
  characterId: string;
  previousFrames: string[];
  newPrompt: string;
}

export interface CharacterConsistencyResponse {
  consistent: boolean;
  score: number;
  adjustments: string[];
}

export async function validateCharacterConsistency(
  request: CharacterConsistencyRequest
): Promise<CharacterConsistencyResponse> {
  try {
    const response = await axios.post(`${HIGGSFIELD_API_URL}/consistency/validate`, request, {
      headers: {
        Authorization: `Bearer ${HIGGSFIELD_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      consistent: response.data.consistent,
      score: response.data.score,
      adjustments: response.data.adjustments || [],
    };
  } catch (error) {
    console.error('Higgsfield consistency check failed:', error);
    throw new Error('Character consistency validation failed');
  }
}

export async function getCharacterEmbedding(characterId: string): Promise<number[]> {
  try {
    const response = await axios.get(`${HIGGSFIELD_API_URL}/embeddings/${characterId}`, {
      headers: {
        Authorization: `Bearer ${HIGGSFIELD_API_KEY}`,
      },
    });

    return response.data.embedding;
  } catch (error) {
    console.error('Failed to fetch character embedding:', error);
    throw new Error('Could not retrieve character embedding');
  }
}

export async function generateConsistentFrames(
  characterId: string,
  promptSequence: string[]
): Promise<string[]> {
  const frames: string[] = [];

  for (let i = 0; i < promptSequence.length; i++) {
    const prompt = promptSequence[i];
    const previousFrames = frames.slice(Math.max(0, i - 2));

    const consistency = await validateCharacterConsistency({
      characterId,
      previousFrames,
      newPrompt: prompt,
    });

    if (consistency.consistent && consistency.score > 0.8) {
      frames.push(prompt);
    } else {
      const adjustedPrompt = applyConsistencyAdjustments(prompt, consistency.adjustments);
      frames.push(adjustedPrompt);
    }
  }

  return frames;
}

function applyConsistencyAdjustments(prompt: string, adjustments: string[]): string {
  let adjusted = prompt;
  adjustments.forEach((adjustment) => {
    adjusted = `${adjusted}, ${adjustment}`;
  });
  return adjusted;
}
