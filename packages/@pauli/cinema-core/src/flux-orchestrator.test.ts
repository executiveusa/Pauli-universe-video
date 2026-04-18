import { describe, it, expect, beforeEach, vi } from "vitest";
import { FluxOrchestrator } from "./flux-orchestrator";
import axios from "axios";

vi.mock("axios");

describe("FluxOrchestrator", () => {
  let orchestrator: FluxOrchestrator;
  const mockImageBase64 = Buffer.from("fake-image-data").toString("base64");

  beforeEach(() => {
    process.env.MODAL_API_KEY = "test-key";
    orchestrator = new FluxOrchestrator();
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("throws if MODAL_API_KEY is not set", () => {
      delete process.env.MODAL_API_KEY;
      expect(() => new FluxOrchestrator()).toThrow("MODAL_API_KEY");
    });
  });

  describe("generateKeyframe", () => {
    it("generates keyframe successfully", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          image_base64: mockImageBase64,
          image_size: 1024,
          metadata: { model: "FLUX.1-dev" },
          cost: 0.05,
        },
      });

      const result = await orchestrator.generateKeyframe(
        "Einstein in quantum lab"
      );

      expect(result.success).toBe(true);
      expect(result.imageBase64).toBe(mockImageBase64);
      expect(result.cost).toBe(0.05);
      expect(result.retries).toBe(0);
    });

    it("throws on empty prompt", async () => {
      await expect(orchestrator.generateKeyframe("")).rejects.toThrow(
        "empty"
      );
    });

    it("throws on invalid dimensions", async () => {
      await expect(
        orchestrator.generateKeyframe("test", { height: 500 })
      ).rejects.toThrow("multiples of 64");
    });

    it("retries on timeout", async () => {
      vi.mocked(axios.post)
        .mockRejectedValueOnce(new Error("timeout"))
        .mockResolvedValueOnce({
          data: {
            success: true,
            image_base64: mockImageBase64,
            cost: 0.05,
          },
        });

      const result = await orchestrator.generateKeyframe("test");

      expect(result.success).toBe(true);
      expect(result.retries).toBe(1);
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(2);
    });

    it("retries on rate limit (429)", async () => {
      const error: any = new Error("Rate limited");
      error.code = "unknown";
      error.response = { status: 429 };

      vi.mocked(axios.post)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: {
            success: true,
            image_base64: mockImageBase64,
            cost: 0.05,
          },
        });

      const result = await orchestrator.generateKeyframe("test");

      expect(result.success).toBe(true);
      expect(result.retries).toBe(1);
    });

    it("exhausts retries and returns error", async () => {
      vi.mocked(axios.post).mockRejectedValue(
        new Error("Service unavailable")
      );

      const result = await orchestrator.generateKeyframe("test");

      expect(result.success).toBe(false);
      expect(result.error).toContain("after");
      expect(result.retries).toBe(3);
    });

    it("tracks daily cost", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          image_base64: mockImageBase64,
          cost: 0.05,
        },
      });

      await orchestrator.generateKeyframe("test 1");
      await orchestrator.generateKeyframe("test 2");

      expect(orchestrator.getDailyCost()).toBeCloseTo(0.1, 2);
    });

    it("respects daily budget limit", async () => {
      orchestrator.setDailyBudget(0.03);

      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          image_base64: mockImageBase64,
          cost: 0.05,
        },
      });

      await orchestrator.generateKeyframe("test 1");

      await expect(
        orchestrator.generateKeyframe("test 2")
      ).rejects.toThrow("budget exceeded");
    });

    it("does not retry on authentication error", async () => {
      vi.mocked(axios.post).mockRejectedValue(
        new Error("Authentication failed")
      );

      const result = await orchestrator.generateKeyframe("test");

      expect(result.success).toBe(false);
      expect(result.retries).toBe(0);
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);
    });
  });

  describe("batchGenerateKeyframes", () => {
    it("generates multiple keyframes", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          image_base64: mockImageBase64,
          cost: 0.05,
        },
      });

      const results = await orchestrator.batchGenerateKeyframes([
        "test 1",
        "test 2",
        "test 3",
      ]);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it("handles partial failures in batch", async () => {
      vi.mocked(axios.post)
        .mockResolvedValueOnce({
          data: { success: true, image_base64: mockImageBase64, cost: 0.05 },
        })
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce({
          data: { success: true, image_base64: mockImageBase64, cost: 0.05 },
        });

      const results = await orchestrator.batchGenerateKeyframes([
        "test 1",
        "test 2",
        "test 3",
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe("cost tracking", () => {
    it("gets daily cost", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          image_base64: mockImageBase64,
          cost: 0.05,
        },
      });

      await orchestrator.generateKeyframe("test");
      expect(orchestrator.getDailyCost()).toBe(0.05);
    });

    it("resets daily cost", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          success: true,
          image_base64: mockImageBase64,
          cost: 0.05,
        },
      });

      await orchestrator.generateKeyframe("test");
      orchestrator.resetDailyCost();
      expect(orchestrator.getDailyCost()).toBe(0);
    });
  });

  describe("budget management", () => {
    it("sets daily budget", () => {
      expect(() => orchestrator.setDailyBudget(100)).not.toThrow();
    });

    it("throws on invalid budget", () => {
      expect(() => orchestrator.setDailyBudget(0)).toThrow("positive");
      expect(() => orchestrator.setDailyBudget(-10)).toThrow("positive");
    });
  });
});
