import axios from "axios";
import * as fs from "fs";
import * as path from "path";

export interface EmbeddingOptions {
  modelUrl?: string;
  modelPath?: string;
  normalize?: boolean;
}

export interface CharacterEmbedding {
  id: string;
  text?: string;
  imagePath?: string;
  vector: number[];
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  normalized: boolean;
}

/**
 * Character embedding layer using CLIP-like pre-trained model via Modal API.
 * Generates 768-dimensional vectors for character images/descriptions.
 */
export class CharacterEmbedder {
  private modelUrl: string;
  private modalApiUrl: string;
  private modalApiKey: string;
  private cache: Map<string, number[]> = new Map();
  private vectorDimensions = 768;

  constructor(options: EmbeddingOptions = {}) {
    this.modalApiUrl = process.env.MODAL_API_URL || "https://modal.com/api/v1";
    this.modalApiKey = process.env.MODAL_API_KEY || "";
    this.modelUrl =
      options.modelUrl ||
      process.env.EMBEDDING_MODEL_URL ||
      "openai/clip-vit-base-patch32";

    if (!this.modalApiKey) {
      throw new Error("MODAL_API_KEY environment variable not set");
    }
  }

  /**
   * Generate embedding from text description or image URL.
   */
  async embed(input: string | Buffer, type: "text" | "image"): Promise<number[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(input, type);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const vector =
        type === "text"
          ? await this.embedText(input as string)
          : await this.embedImage(input as Buffer);

      // Store in cache
      this.cache.set(cacheKey, vector);
      return vector;
    } catch (error) {
      throw new Error(
        `Embedding failed for ${type}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate embedding from text using Modal API.
   */
  private async embedText(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error("Text input cannot be empty");
    }

    const response = await axios.post(
      `${this.modalApiUrl}/embed/text`,
      {
        text: text.trim(),
        model: this.modelUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${this.modalApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (!response.data.embedding || !Array.isArray(response.data.embedding)) {
      throw new Error("Invalid embedding response from Modal API");
    }

    return this.normalizeVector(response.data.embedding);
  }

  /**
   * Generate embedding from image using Modal API.
   */
  private async embedImage(imageBuffer: Buffer): Promise<number[]> {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error("Image buffer cannot be empty");
    }

    const base64Image = imageBuffer.toString("base64");

    const response = await axios.post(
      `${this.modalApiUrl}/embed/image`,
      {
        image: `data:image/png;base64,${base64Image}`,
        model: this.modelUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${this.modalApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    if (!response.data.embedding || !Array.isArray(response.data.embedding)) {
      throw new Error("Invalid embedding response from Modal API");
    }

    return this.normalizeVector(response.data.embedding);
  }

  /**
   * Compute cosine similarity between two vectors.
   */
  similarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error("Vector dimensions must match");
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * Validate embedding vector for quality and dimensions.
   */
  validate(vector: number[]): boolean {
    if (!Array.isArray(vector)) return false;
    if (vector.length !== this.vectorDimensions) return false;
    if (!vector.every((v) => typeof v === "number" && !isNaN(v))) return false;

    // Check L2 norm is approximately 1.0 (normalized)
    let norm = 0;
    for (const v of vector) {
      norm += v * v;
    }
    norm = Math.sqrt(norm);

    return norm > 0.99 && norm < 1.01;
  }

  /**
   * Normalize vector to unit L2 norm.
   */
  private normalizeVector(vector: number[]): number[] {
    let norm = 0;
    for (const v of vector) {
      norm += v * v;
    }
    norm = Math.sqrt(norm);

    if (norm === 0) {
      throw new Error("Cannot normalize zero vector");
    }

    return vector.map((v) => v / norm);
  }

  /**
   * Get cache key for input.
   */
  private getCacheKey(input: string | Buffer, type: "text" | "image"): string {
    if (type === "text") {
      return `text:${input as string}`;
    }
    return `image:${(input as Buffer).toString("base64").substring(0, 64)}`;
  }

  /**
   * Clear embedding cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export { CharacterEmbedder as default };
