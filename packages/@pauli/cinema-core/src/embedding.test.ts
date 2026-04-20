import { describe, it, expect, beforeEach, vi } from "vitest";
import { CharacterEmbedder } from "./embedding";
import axios from "axios";

vi.mock("axios");

describe("CharacterEmbedder", () => {
  let embedder: CharacterEmbedder;

  beforeEach(() => {
    process.env.MODAL_API_KEY = "test-key";
    embedder = new CharacterEmbedder();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("throws if MODAL_API_KEY is not set", () => {
      delete process.env.MODAL_API_KEY;
      expect(() => new CharacterEmbedder()).toThrow("MODAL_API_KEY");
    });

    it("initializes with correct defaults", () => {
      expect(embedder).toBeDefined();
    });
  });

  describe("embedText", () => {
    it("generates embedding from text", async () => {
      const mockVector = Array(768).fill(0);
      mockVector[0] = 0.707;
      mockVector[1] = 0.707;

      vi.mocked(axios.post).mockResolvedValue({
        data: { embedding: mockVector },
      });

      const result = await embedder.embed("Einstein in a quantum lab", "text");

      expect(result).toHaveLength(768);
      expect(result[0]).toBeCloseTo(0.707, 2);
    });

    it("throws on empty text input", async () => {
      await expect(embedder.embed("", "text")).rejects.toThrow("empty");
    });

    it("throws on invalid API response", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { embedding: null },
      });

      await expect(embedder.embed("test", "text")).rejects.toThrow("Invalid");
    });
  });

  describe("embedImage", () => {
    it("generates embedding from image buffer", async () => {
      const mockVector = Array(768).fill(0);
      mockVector[0] = 0.5;
      mockVector[1] = 0.5;

      vi.mocked(axios.post).mockResolvedValue({
        data: { embedding: mockVector },
      });

      const imageBuffer = Buffer.from("fake-image-data");
      const result = await embedder.embed(imageBuffer, "image");

      expect(result).toHaveLength(768);
    });

    it("throws on empty image buffer", async () => {
      const emptyBuffer = Buffer.from([]);
      await expect(embedder.embed(emptyBuffer, "image")).rejects.toThrow(
        "empty"
      );
    });
  });

  describe("similarity", () => {
    it("computes cosine similarity correctly", () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      expect(embedder.similarity(vec1, vec2)).toBeCloseTo(1.0, 5);
    });

    it("returns 0 for orthogonal vectors", () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];
      expect(embedder.similarity(vec1, vec2)).toBeCloseTo(0.0, 5);
    });

    it("throws on dimension mismatch", () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0];
      expect(() => embedder.similarity(vec1, vec2)).toThrow("dimensions");
    });
  });

  describe("validate", () => {
    it("validates correct embedding vector", () => {
      const normalizedVec = Array(768).fill(0);
      normalizedVec[0] = 1.0;
      expect(embedder.validate(normalizedVec)).toBe(true);
    });

    it("rejects non-array input", () => {
      expect(embedder.validate(null as unknown as number[])).toBe(false);
    });

    it("rejects wrong dimensions", () => {
      const wrongDim = Array(512).fill(0);
      expect(embedder.validate(wrongDim)).toBe(false);
    });

    it("rejects non-normalized vectors", () => {
      const nonNorm = Array(768).fill(2.0);
      expect(embedder.validate(nonNorm)).toBe(false);
    });

    it("rejects vectors with NaN", () => {
      const withNaN = Array(768).fill(0);
      withNaN[0] = NaN;
      expect(embedder.validate(withNaN)).toBe(false);
    });
  });

  describe("cache", () => {
    it("caches text embeddings", async () => {
      const mockVector = Array(768).fill(0);
      mockVector[0] = 0.5;

      vi.mocked(axios.post).mockResolvedValue({
        data: { embedding: mockVector },
      });

      await embedder.embed("Pauli exclusion", "text");
      const stats1 = embedder.getCacheStats();

      await embedder.embed("Pauli exclusion", "text");
      const stats2 = embedder.getCacheStats();

      expect(stats1.size).toBe(1);
      expect(stats2.size).toBe(1);
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);
    });

    it("clears cache", async () => {
      const mockVector = Array(768).fill(0);
      mockVector[0] = 0.5;

      vi.mocked(axios.post).mockResolvedValue({
        data: { embedding: mockVector },
      });

      await embedder.embed("test", "text");
      expect(embedder.getCacheStats().size).toBe(1);

      embedder.clearCache();
      expect(embedder.getCacheStats().size).toBe(0);
    });
  });
});
