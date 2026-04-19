import { describe, it, expect, beforeEach, vi } from "vitest";
import { KlingClient } from "./kling-client";
import axios from "axios";

vi.mock("axios");

describe("KlingClient", () => {
  let client: KlingClient;
  const mockVideoBase64 = Buffer.from("fake-video-data").toString("base64");
  // Generate a keyframe base64 string >= 100 chars (needed for validation)
  const mockKeyframeBase64 = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  ).toString("base64").repeat(2).slice(0, 150);

  beforeEach(() => {
    process.env.MODAL_API_KEY = "test-key";
    client = new KlingClient();
    vi.clearAllMocks();
  });

  describe("generateVideo", () => {
    it("generates video successfully", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          video_base64: mockVideoBase64,
          video_size: 4194304,
          metadata: { provider: "kling-3.0" },
          cost: 0.10,
        },
      });

      const result = await client.generateVideo(
        mockKeyframeBase64,
        "Einstein teaching physics"
      );

      expect(result.success).toBe(true);
      expect(result.videoBase64).toBe(mockVideoBase64);
      expect(result.cost).toBe(0.10);
      expect(result.retries).toBe(0);
    });

    it("throws on empty keyframe", async () => {
      await expect(
        client.generateVideo("", "test")
      ).rejects.toThrow("keyframe");
    });

    it("throws on empty prompt", async () => {
      await expect(
        client.generateVideo(mockKeyframeBase64, "")
      ).rejects.toThrow("prompt");
    });

    it("throws on invalid duration", async () => {
      await expect(
        client.generateVideo(mockKeyframeBase64, "test", {
          durationSec: 35,
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
            cost: 0.10,
          },
        });

      const result = await client.generateVideo(
        mockKeyframeBase64,
        "test"
      );

      expect(result.success).toBe(true);
      expect(result.retries).toBe(1);
    });

    it("exhausts retries (max 2)", async () => {
      vi.mocked(axios.post).mockRejectedValue(
        new Error("Service unavailable")
      );

      const result = await client.generateVideo(
        mockKeyframeBase64,
        "test"
      );

      expect(result.success).toBe(false);
      expect(result.retries).toBe(2);
      expect(vi.mocked(axios.post).mock.calls.length).toBe(3); // 1 + 2 retries
    });

    it("does not retry on authentication error", async () => {
      vi.mocked(axios.post).mockRejectedValue(
        new Error("Authentication failed")
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
});
