import { describe, it, expect, beforeEach, vi } from "vitest";
import { SeedanceClient } from "./seedance-client";
import axios from "axios";

vi.mock("axios");

describe("SeedanceClient", () => {
  let client: SeedanceClient;
  const mockVideoBase64 = Buffer.from("fake-video-data").toString("base64");
  // Generate a keyframe base64 string >= 100 chars (needed for validation)
  const mockKeyframeBase64 = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  ).toString("base64").repeat(2).slice(0, 150);

  beforeEach(() => {
    process.env.MODAL_API_KEY = "test-key";
    client = new SeedanceClient();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("throws if MODAL_API_KEY is not set", () => {
      delete process.env.MODAL_API_KEY;
      expect(() => new SeedanceClient()).toThrow("MODAL_API_KEY");
    });
  });

  describe("generateVideo", () => {
    it("generates video successfully", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          video_base64: mockVideoBase64,
          video_size: 5242880,
          metadata: { provider: "seedance-2.0" },
          cost: 0.15,
        },
      });

      const result = await client.generateVideo(
        mockKeyframeBase64,
        "Einstein plays piano"
      );

      expect(result.success).toBe(true);
      expect(result.videoBase64).toBe(mockVideoBase64);
      expect(result.cost).toBe(0.15);
      expect(result.retries).toBe(0);
    });

    it("throws on empty keyframe", async () => {
      await expect(
        client.generateVideo("", "test prompt")
      ).rejects.toThrow("keyframe");
    });

    it("throws on empty prompt", async () => {
      await expect(
        client.generateVideo(mockKeyframeBase64, "")
      ).rejects.toThrow("Prompt cannot be empty");
    });

    it("throws on invalid motion intensity", async () => {
      await expect(
        client.generateVideo(mockKeyframeBase64, "test", {
          motionIntensity: 11,
        })
      ).rejects.toThrow("1-10");
    });

    it("throws on invalid duration", async () => {
      await expect(
        client.generateVideo(mockKeyframeBase64, "test", {
          durationSec: 50,
        })
      ).rejects.toThrow("5-30");
    });

    it("retries on timeout", async () => {
      vi.mocked(axios.post)
        .mockRejectedValueOnce(new Error("timeout"))
        .mockResolvedValueOnce({
          data: {
            success: true,
            video_base64: mockVideoBase64,
            cost: 0.15,
          },
        });

      const result = await client.generateVideo(
        mockKeyframeBase64,
        "test"
      );

      expect(result.success).toBe(true);
      expect(result.retries).toBe(1);
    });

    it("retries on rate limit", async () => {
      const error: any = new Error("Rate limited");
      error.response = { status: 429 };

      vi.mocked(axios.post)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: {
            success: true,
            video_base64: mockVideoBase64,
            cost: 0.15,
          },
        });

      const result = await client.generateVideo(
        mockKeyframeBase64,
        "test"
      );

      expect(result.success).toBe(true);
      expect(result.retries).toBe(1);
    });

    it("exhausts retries and returns error", async () => {
      vi.mocked(axios.post).mockRejectedValue(
        new Error("Service unavailable")
      );

      const result = await client.generateVideo(
        mockKeyframeBase64,
        "test"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("after");
      expect(result.retries).toBe(3);
    }, { timeout: 15000 });

    it("does not retry on authentication error", async () => {
      vi.mocked(axios.post).mockRejectedValue(
        new Error("authentication failed")
      );

      const result = await client.generateVideo(
        mockKeyframeBase64,
        "test"
      );

      expect(result.success).toBe(false);
      expect(result.retries).toBe(0);
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);
    });
  });

  describe("batchGenerateVideos", () => {
    it("generates multiple videos", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          video_base64: mockVideoBase64,
          cost: 0.15,
        },
      });

      const results = await client.batchGenerateVideos(
        [mockKeyframeBase64, mockKeyframeBase64],
        ["test 1", "test 2"]
      );

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it("handles failures in batch", async () => {
      let callCount = 0;
      vi.mocked(axios.post).mockImplementation(async () => {
        callCount++;
        // Item 1: call 1 - success
        // Item 2: calls 2-4 (1 + 3 retries) - fail all
        // Item 3: call 5+ - success
        if (callCount === 1 || callCount > 4) {
          return {
            data: { success: true, video_base64: mockVideoBase64, cost: 0.15 },
          };
        }
        // Calls 2, 3, 4 are for item 2 - all fail with authentication error (not retryable after first fail)
        const authError = new Error("authentication failed");
        throw authError;
      });

      const results = await client.batchGenerateVideos(
        [mockKeyframeBase64, mockKeyframeBase64, mockKeyframeBase64],
        ["test 1", "test 2", "test 3"]
      );

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    }, { timeout: 15000 });
  });
});
