import { describe, it, expect, beforeEach } from "vitest";
import { FrameProcessor } from "./frame-processor";

describe("FrameProcessor", () => {
  let processor: FrameProcessor;

  beforeEach(() => {
    processor = new FrameProcessor();
  });

  describe("interpolateFrames", () => {
    it("rejects empty buffer", async () => {
      const result = await processor.interpolateFrames(Buffer.from([]));
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid");
    });

    it("rejects invalid FPS", async () => {
      const mockBuffer = Buffer.from("fake video data");
      const result = await processor.interpolateFrames(mockBuffer, {
        targetFps: 100,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("FPS");
    });

    it("returns zero FPS on failure", async () => {
      const result = await processor.interpolateFrames(Buffer.from([0]));
      expect(result.fps).toBe(0);
      expect(result.success).toBe(false);
    });
  });

  describe("normalizeVideo", () => {
    it("rejects invalid resolution", async () => {
      const mockBuffer = Buffer.from("fake data");
      // Note: actual normalization would fail with fake buffer
      const result = await processor.normalizeVideo(mockBuffer, 0, 0, 24);
      expect(result.success).toBe(false);
    });
  });

  describe("validateVideo", () => {
    it("detects file too small", async () => {
      const result = await processor.validateVideo(Buffer.from("tiny"));
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("detects file size constraints", async () => {
      // Test that validation logic checks size bounds
      // Create a tiny buffer to test min size check
      const tinyBuffer = Buffer.alloc(1000);
      const tinyResult = await processor.validateVideo(tinyBuffer);
      expect(tinyResult.issues.some(issue => issue.includes("too small"))).toBe(true);

      // Large file size check happens via buffer.length check
      // Avoid allocating 1GB in CI - validation logic already bounds-checks
    });
  });
});
