import { describe, it, expect, beforeEach } from "vitest";
import { UDECScorer } from "./udec-scorer";

describe("UDECScorer", () => {
  let scorer: UDECScorer;

  beforeEach(() => {
    scorer = new UDECScorer();
  });

  describe("scoreVideo", () => {
    it("scores ideal video highly", async () => {
      const metadata = {
        videoSize: 5242880,
        duration: 20,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 240000, // 4 minutes
      };

      const score = await scorer.scoreVideo(Buffer.alloc(5242880), metadata);

      expect(score.overall).toBeGreaterThanOrEqual(8.5);
      expect(score.mot).toBeGreaterThanOrEqual(9);
      expect(score.spd).toBeGreaterThanOrEqual(8);
    });

    it("deducts for low FPS", async () => {
      const metadataGood = {
        videoSize: 5242880,
        duration: 20,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 240000,
      };

      const metadataBad = {
        videoSize: 5242880,
        duration: 20,
        fps: 18,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 240000,
      };

      const scoreGood = await scorer.scoreVideo(Buffer.alloc(5242880), metadataGood);
      const scoreBad = await scorer.scoreVideo(Buffer.alloc(5242880), metadataBad);

      expect(scoreGood.mot).toBeGreaterThan(scoreBad.mot);
    });

    it("calculates weighted overall score", async () => {
      const metadata = {
        videoSize: 5242880,
        duration: 20,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 240000,
      };

      const score = await scorer.scoreVideo(Buffer.alloc(5242880), metadata);

      // Overall should be a weighted average
      expect(score.overall).toBeGreaterThan(0);
      expect(score.overall).toBeLessThanOrEqual(10);
    });

    it("handles short videos", async () => {
      const metadata = {
        videoSize: 1048576,
        duration: 5,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 120000,
      };

      const score = await scorer.scoreVideo(Buffer.alloc(1048576), metadata);
      expect(score.overall).toBeGreaterThan(0);
    });

    it("penalizes slow generation", async () => {
      const metadataFast = {
        videoSize: 5242880,
        duration: 20,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 240000,
      };

      const metadataSlow = {
        videoSize: 5242880,
        duration: 20,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 600000, // 10 minutes
      };

      const scoreFast = await scorer.scoreVideo(Buffer.alloc(5242880), metadataFast);
      const scoreSlow = await scorer.scoreVideo(Buffer.alloc(5242880), metadataSlow);

      expect(scoreFast.spd).toBeGreaterThan(scoreSlow.spd);
    });
  });

  describe("isQualityPass", () => {
    it("returns true for high scores", async () => {
      const metadata = {
        videoSize: 5242880,
        duration: 20,
        fps: 24,
        resolution: "1920x1080",
        codec: "h264",
        generationTimeMs: 240000,
      };

      const score = await scorer.scoreVideo(Buffer.alloc(5242880), metadata);
      expect(scorer.isQualityPass(score, 8.5)).toBe(true);
    });

    it("respects threshold parameter", () => {
      const score = {
        mot: 8,
        acc: 8,
        typ: 8,
        clr: 8,
        spd: 8,
        rsp: 8,
        cod: 8,
        arc: 8,
        dep: 8,
        doc: 8,
        err: 8,
        prf: 8,
        sec: 8,
        ux: 8,
        overall: 8.0,
      };

      expect(scorer.isQualityPass(score, 7.5)).toBe(true);
      expect(scorer.isQualityPass(score, 8.5)).toBe(false);
    });
  });

  describe("getQualityFeedback", () => {
    it("provides feedback for low-scoring axes", async () => {
      const score = {
        mot: 6,
        acc: 9,
        typ: 9,
        clr: 9,
        spd: 9,
        rsp: 9,
        cod: 9,
        arc: 9,
        dep: 9,
        doc: 9,
        err: 9,
        prf: 9,
        sec: 9,
        ux: 9,
        overall: 8.0,
      };

      const feedback = scorer.getQualityFeedback(score);
      expect(feedback.some((f) => f.includes("motion"))).toBe(true);
    });

    it("confirms excellent quality", () => {
      const score = {
        mot: 9.5,
        acc: 9,
        typ: 9,
        clr: 9,
        spd: 9,
        rsp: 9,
        cod: 9,
        arc: 9,
        dep: 9,
        doc: 9,
        err: 9,
        prf: 9,
        sec: 9,
        ux: 9,
        overall: 9.0,
      };

      const feedback = scorer.getQualityFeedback(score);
      expect(feedback).toContain("Quality is excellent - no improvements needed");
    });
  });
});
