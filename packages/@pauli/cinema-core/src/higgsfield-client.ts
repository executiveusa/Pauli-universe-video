import axios from "axios";
import { z } from "zod";

const HiggsfieldResultSchema = z.object({
  success: z.boolean(),
  soul_id: z.string().optional(),
  error: z.string().optional(),
});

export interface HiggsfieldOptions {
  style?: string;
  trainingQuality?: "low" | "medium" | "high";
}

/**
 * Higgsfield API client for character consistency.
 * Trains character identity ("Soul ID") for consistency across videos.
 */
export class HiggsfieldClient {
  private apiUrl: string;
  private apiKey: string;
  private soulIdCache: Map<string, string> = new Map();

  constructor() {
    this.apiUrl = process.env.HIGGSFIELD_API_URL || "https://api.higgsfield.ai/v1";
    this.apiKey = process.env.HIGGSFIELD_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("HIGGSFIELD_API_KEY environment variable not set");
    }
  }

  /**
   * Train character from images to get Soul ID.
   */
  async trainCharacter(
    imageBuffers: Buffer[],
    characterName: string,
    options: HiggsfieldOptions = {}
  ): Promise<string> {
    // Check cache
    const cacheKey = `${characterName}:${options.style || "default"}`;
    if (this.soulIdCache.has(cacheKey)) {
      return this.soulIdCache.get(cacheKey)!;
    }

    if (imageBuffers.length === 0) {
      throw new Error("At least one image required for training");
    }

    if (imageBuffers.some((buf) => buf.length < 1000)) {
      throw new Error("All images must be at least 1KB");
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/characters/train`,
        {
          character_name: characterName,
          images: imageBuffers.map((buf) => buf.toString("base64")),
          style: options.style || "general",
          training_quality: options.trainingQuality || "high",
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 120000,
        }
      );

      const validated = HiggsfieldResultSchema.parse(response.data);

      if (!validated.success || !validated.soul_id) {
        throw new Error(validated.error || "Training failed");
      }

      // Cache the Soul ID (24-hour TTL would be handled elsewhere)
      this.soulIdCache.set(cacheKey, validated.soul_id);

      return validated.soul_id;
    } catch (error) {
      throw new Error(`Higgsfield training failed: ${String(error)}`);
    }
  }

  /**
   * Generate video with character consistency.
   */
  async generateWithConsistency(
    soulId: string,
    prompt: string,
    motionIntensity: number = 5
  ): Promise<{
    success: boolean;
    consistencyScore: number;
    error?: string;
  }> {
    if (!soulId || soulId.trim().length === 0) {
      throw new Error("Soul ID required");
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt required");
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/videos/generate`,
        {
          soul_id: soulId,
          prompt,
          motion_intensity: motionIntensity,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 600000,
        }
      );

      return {
        success: response.data.success,
        consistencyScore: response.data.consistency_score || 0,
      };
    } catch (error) {
      return {
        success: false,
        consistencyScore: 0,
        error: String(error),
      };
    }
  }

  /**
   * Check consistency between frames in a video.
   */
  async checkConsistency(
    videoBuffer: Buffer,
    soulId: string
  ): Promise<{
    consistent: boolean;
    score: number;
    issues: string[];
  }> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/videos/analyze`,
        {
          video: videoBuffer.toString("base64"),
          soul_id: soulId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 120000,
        }
      );

      return {
        consistent: response.data.consistency_score >= 0.8,
        score: response.data.consistency_score || 0,
        issues: response.data.issues || [],
      };
    } catch (error) {
      return {
        consistent: false,
        score: 0,
        issues: [String(error)],
      };
    }
  }

  /**
   * Clear Soul ID cache.
   */
  clearCache(): void {
    this.soulIdCache.clear();
  }

  /**
   * Get cached Soul ID.
   */
  getCachedSoulId(characterName: string, style?: string): string | undefined {
    const cacheKey = `${characterName}:${style || "default"}`;
    return this.soulIdCache.get(cacheKey);
  }
}

export { HiggsfieldClient as default };
