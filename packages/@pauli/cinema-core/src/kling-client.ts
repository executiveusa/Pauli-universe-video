import axios from "axios";
import { z } from "zod";

const KlingResultSchema = z.object({
  success: z.boolean(),
  video_base64: z.string().optional(),
  video_size: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  cost: z.number(),
  error: z.string().optional(),
});

export interface KlingOptions {
  durationSec?: number;
}

export interface KlingResult {
  success: boolean;
  videoBase64?: string;
  videoSize?: number;
  metadata?: Record<string, unknown>;
  cost: number;
  error?: string;
  retries: number;
}

/**
 * Kling 3.0 video generation client (FALLBACK provider).
 * Used when primary provider (Seedance) is unavailable.
 */
export class KlingClient {
  private modalUrl: string;
  private modalApiKey: string;
  private maxRetries = 2;
  private baseBackoffMs = 1500;

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
    options: KlingOptions = {}
  ): Promise<KlingResult> {
    // Validate inputs
    if (!keyframeBase64 || keyframeBase64.length < 100) {
      throw new Error("Invalid keyframe data");
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty");
    }

    const durationSec = options.durationSec || 20;

    if (durationSec < 5 || durationSec > 30) {
      throw new Error("Duration must be 5-30 seconds");
    }

    let lastError: Error | null = null;
    let totalRetries = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.callKlingAPI(
          keyframeBase64,
          prompt,
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

        const backoffMs = this.baseBackoffMs * Math.pow(2, attempt) +
          Math.random() * 800;
        await this.sleep(backoffMs);
      }
    }

    return {
      success: false,
      cost: 0,
      error: `Kling failed after ${totalRetries + 1} attempts: ${lastError?.message}`,
      retries: totalRetries,
    };
  }

  /**
   * Call Modal API for Kling generation.
   */
  private async callKlingAPI(
    keyframeBase64: string,
    prompt: string,
    durationSec: number
  ): Promise<Omit<KlingResult, "retries">> {
    const payload = {
      keyframe_base64: keyframeBase64,
      prompt,
      duration_sec: durationSec,
    };

    try {
      const response = await axios.post(
        `${this.modalUrl}/call/generate_kling_video`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.modalApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 600000,
        }
      );

      const validated = KlingResultSchema.parse(response.data);

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
}

export { KlingClient as default };
