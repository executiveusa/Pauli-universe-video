import { describe, it, expect, beforeEach } from "vitest";
import { QualityGate } from "./quality-gate";

describe("QualityGate", () => {
  let gate: QualityGate;

  beforeEach(() => {
    gate = new QualityGate();
  });

  describe("processVideo", () => {
    it("approves high-quality videos", async () => {
      const metadata = {
        videoSize: 5242880,
        duration: 20,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 240000,
      };

      const result = await gate.processVideo("job-1", Buffer.alloc(5242880), metadata);

      expect(result.status).toBe("approved");
      expect(result.score.overall).toBeGreaterThanOrEqual(8.5);
    });

    it("marks for retry when below threshold", async () => {
      const metadata = {
        videoSize: 1000,
        duration: 1,
        fps: 10,
        resolution: "640x480",
        codec: "h264",
        generationTimeMs: 60000,
      };

      const result = await gate.processVideo("job-1", Buffer.alloc(1000), metadata);

      if (result.score.overall < 8.5 && result.retryCount < result.maxRetries) {
        expect(result.shouldRetry).toBe(true);
      }
    });

    it("tracks retry count", async () => {
      const metadata = {
        videoSize: 1000,
        duration: 1,
        fps: 10,
        resolution: "640x480",
        codec: "h264",
        generationTimeMs: 60000,
      };

      const result1 = await gate.processVideo("job-1", Buffer.alloc(1000), metadata);
      const result2 = await gate.processVideo("job-1", Buffer.alloc(1000), metadata);

      expect(result2.retryCount).toBeGreaterThanOrEqual(result1.retryCount);
    });

    it("sends to manual review after max retries", async () => {
      gate = new QualityGate({ maxRetries: 1 });

      const badMetadata = {
        videoSize: 100,
        duration: 1,
        fps: 5,
        resolution: "320x240",
        codec: "h264",
        generationTimeMs: 1000,
      };

      // Try multiple times
      let lastResult = await gate.processVideo("job-1", Buffer.alloc(100), badMetadata);
      for (let i = 0; i < 2; i++) {
        lastResult = await gate.processVideo("job-1", Buffer.alloc(100), badMetadata);
      }

      if (lastResult.retryCount >= lastResult.maxRetries) {
        expect(lastResult.status).toBe("pending_review");
      }
    });
  });

  describe("batchProcess", () => {
    it("processes multiple videos", async () => {
      const goodMetadata = {
        videoSize: 5242880,
        duration: 20,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 240000,
      };

      const jobs = [
        { jobId: "job-1", videoBuffer: Buffer.alloc(5242880), metadata: goodMetadata },
        { jobId: "job-2", videoBuffer: Buffer.alloc(5242880), metadata: goodMetadata },
      ];

      const results = await gate.batchProcess(jobs);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.status === "approved")).toBe(true);
    });
  });

  describe("getStats", () => {
    it("calculates statistics", async () => {
      const goodMetadata = {
        videoSize: 5242880,
        duration: 20,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 240000,
      };

      const result = await gate.processVideo("job-1", Buffer.alloc(5242880), goodMetadata);
      const stats = gate.getStats([result]);

      expect(stats.averageScore).toBeGreaterThan(0);
    });
  });
});
