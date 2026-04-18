import axios from "axios";
import { z } from "zod";

const SeedanceResultSchema = z.object({
  success: z.boolean(),
  video_base64: z.string().optional(),
  video_size: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  cost: z.number(),
  error: z.string().optional(),
});

export interface SeedanceOptions {
  motionIntensity?: number;
  durationSec?: number;
}

export interface SeedanceResult {
  success: boolean;
  videoBase64?: string;
  videoSize?: number;
  metadata?: Record<string, unknown>;
  cost: number;
  error?: string;
  retries: number;
}

/**
 * Seedance 2.0 video generation client (PRIMARY provider).
 * Generates videos from keyframe images with motion synthesis.
 */
export class SeedanceClient {
  private modalUrl: string;
  private modalApiKey: string;
  private maxRetries = 3;
  private baseBackoffMs = 2000;

  constructor() {
    this.modalUrl = process.env.MODAL_API_URL || "https://api.modal.com";
    this.modalApiKey = process.env.MODAL_API_KEY || "";

    if (!this.modalApiKey) {
      throw new Error("MODAL_API_KEY environment variable not set");
    }
  }

  /**
   * Generate video from keyframe with automatic retry.
   */
  async generateVideo(
    keyframeBase64: string,
    prompt: string,
    options: SeedanceOptions = {}
  ): Promise<SeedanceResult> {
    // Validate inputs
    if (!keyframeBase64 || keyframeBase64.length < 100) {
      throw new Error("Invalid keyframe data");
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty");
    }

    const motionIntensity = options.motionIntensity || 5;
    const durationSec = options.durationSec || 20;

    if (motionIntensity < 1 || motionIntensity > 10) {
      throw new Error("Motion intensity must be 1-10");
    }

    if (durationSec < 5 || durationSec > 30) {
      throw new Error("Duration must be 5-30 seconds");
    }

    let lastError: Error | null = null;
    let totalRetries = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.callSeedanceAPI(
          keyframeBase64,
          prompt,
          motionIntensity,
          durationSec
        );

        return {
          ...result,
          retries: attempt,
        };
      } catch (error) {
        lastError = error as Error;
        totalRetries = attempt;

        if (!this.isRetryable(error) || attempt === this.maxRetries) {
          break;
        }

        // Exponential backoff
        const backoffMs = this.baseBackoffMs * Math.pow(2, attempt) +
          Math.random() * 1000;
        await this.sleep(backoffMs);
      }
    }

    return {
      success: false,
      cost: 0,
      error: `Seedance failed after ${totalRetries + 1} attempts: ${lastError?.message}`,
      retries: totalRetries,
    };
  }

  /**
   * Call Modal API for Seedance generation.
   */
  private async callSeedanceAPI(
    keyframeBase64: string,
    prompt: string,
    motionIntensity: number,
    durationSec: number
  ): Promise<Omit<SeedanceResult, "retries">> {
    const payload = {
      keyframe_base64: keyframeBase64,
      prompt,
      motion_intensity: motionIntensity,
      duration_sec: durationSec,
    };

    try {
      const response = await axios.post(
        `${this.modalUrl}/call/generate_seedance_video`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.modalApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 900000, // 15 min timeout for video generation
        }
      );

      const validated = SeedanceResultSchema.parse(response.data);

      if (!validated.success) {
        throw new Error(validated.error || "Generation failed");
      }

      return {
        success: true,
        videoBase64: validated.video_base64,
        videoSize: validated.video_size,
        metadata: validated.metadata,
        cost: validated.cost,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new Error("Request timeout");
        }
        if (error.response?.status === 429) {
          throw new Error("Rate limited");
        }
        if (error.response?.status === 503) {
          throw new Error("Service unavailable");
        }
      }
      throw error;
    }
  }

  /**
   * Determine if error is retryable.
   */
  private isRetryable(error: unknown): boolean {
    const errorStr = String(error).toLowerCase();

    if (errorStr.includes("timeout") ||
        errorStr.includes("rate limited") ||
        errorStr.includes("service unavailable")) {
      return true;
    }

    if (errorStr.includes("invalid") ||
        errorStr.includes("authentication")) {
      return false;
    }

    return true;
  }

  /**
   * Sleep for milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Batch generate videos.
   */
  async batchGenerateVideos(
    keyframesBase64: string[],
    prompts: string[],
    options: SeedanceOptions = {}
  ): Promise<SeedanceResult[]> {
    const results: SeedanceResult[] = [];

    for (let i = 0; i < keyframesBase64.length; i++) {
      const result = await this.generateVideo(
        keyframesBase64[i],
        prompts[i],
        options
      );
      results.push(result);
    }

    return results;
  }
}

export { SeedanceClient as default };
