import axios, { AxiosError } from "axios";
import { z } from "zod";

const FluxResultSchema = z.object({
  success: z.boolean(),
  image_base64: z.string().optional(),
  image_size: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  cost: z.number(),
  error: z.string().optional(),
});

export interface FluxOptions {
  height?: number;
  width?: number;
  numSteps?: number;
  guidance?: number;
  seed?: number;
}

export interface FluxResult {
  success: boolean;
  imageBase64?: string;
  imageSize?: number;
  metadata?: Record<string, unknown>;
  cost: number;
  error?: string;
  retries: number;
}

/**
 * Orchestrator for FLUX.2 keyframe generation on Modal.
 * Handles retries, cost tracking, and failure recovery.
 */
export class FluxOrchestrator {
  private modalUrl: string;
  private modalApiKey: string;
  private maxRetries = 3;
  private baseBackoffMs = 1000;
  private dailyBudget = 50;
  private dailyCostTracker = 0;

  constructor() {
    this.modalUrl = process.env.MODAL_API_URL || "https://api.modal.com";
    this.modalApiKey = process.env.MODAL_API_KEY || "";

    if (!this.modalApiKey) {
      throw new Error("MODAL_API_KEY environment variable not set");
    }
  }

  /**
   * Generate keyframe with automatic retry and cost tracking.
   */
  async generateKeyframe(
    prompt: string,
    options: FluxOptions = {}
  ): Promise<FluxResult> {
    // Check daily budget
    if (this.dailyCostTracker >= this.dailyBudget) {
      throw new Error(
        `Daily budget exceeded: $${this.dailyCostTracker.toFixed(2)}/$${this.dailyBudget}`
      );
    }

    // Validate inputs
    if (!prompt || prompt.trim().length === 0) {
      throw new Error("Prompt cannot be empty");
    }

    if ((options.height && options.height % 64 !== 0) ||
        (options.width && options.width % 64 !== 0)) {
      throw new Error("Height and width must be multiples of 64");
    }

    let lastError: Error | null = null;
    let totalRetries = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.callFluxAPI(prompt, options);

        // Track cost
        this.dailyCostTracker += result.cost;

        return {
          ...result,
          retries: attempt,
        };
      } catch (error) {
        lastError = error as Error;
        totalRetries = attempt;

        // Determine if we should retry
        if (!this.isRetryable(error) || attempt === this.maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const backoffMs =
          this.baseBackoffMs * Math.pow(2, attempt) +
          Math.random() * 1000;
        await this.sleep(backoffMs);
      }
    }

    // All retries exhausted
    return {
      success: false,
      cost: 0,
      error: `Failed after ${totalRetries + 1} attempts: ${lastError?.message}`,
      retries: totalRetries,
    };
  }

  /**
   * Call Modal API for FLUX generation.
   */
  private async callFluxAPI(
    prompt: string,
    options: FluxOptions
  ): Promise<Omit<FluxResult, "retries">> {
    const payload = {
      prompt,
      seed: options.seed || this.generateSeed(),
      height: options.height || 768,
      width: options.width || 768,
    };

    try {
      const response = await axios.post(
        `${this.modalUrl}/call/generate_flux_keyframe`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.modalApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 300000,
        }
      );

      const validated = FluxResultSchema.parse(response.data);

      if (!validated.success) {
        throw new Error(validated.error || "Generation failed");
      }

      return {
        success: true,
        imageBase64: validated.image_base64,
        imageSize: validated.image_size,
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

    // Retryable errors
    if (errorStr.includes("timeout") ||
        errorStr.includes("rate limited") ||
        errorStr.includes("econnrefused") ||
        errorStr.includes("service unavailable") ||
        errorStr.includes("temporarily")) {
      return true;
    }

    // Non-retryable errors
    if (errorStr.includes("authentication") ||
        errorStr.includes("invalid prompt") ||
        errorStr.includes("unauthorized")) {
      return false;
    }

    return true; // Default to retryable
  }

  /**
   * Generate random seed.
   */
  private generateSeed(): number {
    return Math.floor(Math.random() * 2147483647);
  }

  /**
   * Sleep for specified milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get daily cost tracker.
   */
  getDailyCost(): number {
    return this.dailyCostTracker;
  }

  /**
   * Reset daily cost tracker (call once per day).
   */
  resetDailyCost(): void {
    this.dailyCostTracker = 0;
  }

  /**
   * Set daily budget.
   */
  setDailyBudget(budget: number): void {
    if (budget <= 0) {
      throw new Error("Budget must be positive");
    }
    this.dailyBudget = budget;
  }

  /**
   * Batch generate keyframes.
   */
  async batchGenerateKeyframes(
    prompts: string[],
    options: FluxOptions = {}
  ): Promise<FluxResult[]> {
    const results: FluxResult[] = [];

    for (const prompt of prompts) {
      try {
        const result = await this.generateKeyframe(prompt, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          cost: 0,
          error: String(error),
          retries: 0,
        });
      }
    }

    return results;
  }
}

export { FluxOrchestrator as default };
