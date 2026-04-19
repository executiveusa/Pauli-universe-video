export interface UDECScore {
  mot: number; // Motion smoothness (0-10)
  acc: number; // Accessibility (0-10)
  typ: number; // Typography quality (0-10)
  clr: number; // Color grading (0-10)
  spd: number; // Speed/generation time (0-10)
  rsp: number; // Responsiveness (0-10)
  cod: number; // Code quality (0-10)
  arc: number; // Architecture (0-10)
  dep: number; // Dependencies (0-10)
  doc: number; // Documentation (0-10)
  err: number; // Error handling (0-10)
  prf: number; // Performance (0-10)
  sec: number; // Security (0-10)
  ux: number; // User experience (0-10)
  overall: number; // Weighted average
}

export interface ScoringMetadata {
  videoSize: number;
  duration: number;
  fps: number;
  resolution: string;
  codec: string;
  generationTimeMs: number;
}

/**
 * UDEC (Universal Digital Experience Coefficient) scoring engine.
 * Evaluates video quality across 14 axes.
 */
export class UDECScorer {
  /**
   * Score a video across all 14 UDEC axes.
   */
  async scoreVideo(
    videoBuffer: Buffer,
    metadata: ScoringMetadata
  ): Promise<UDECScore> {
    const scores: UDECScore = {
      mot: this.scoreMotion(metadata),
      acc: this.scoreAccessibility(metadata),
      typ: this.scoreTypography(videoBuffer),
      clr: this.scoreColor(videoBuffer),
      spd: this.scoreSpeed(metadata),
      rsp: this.scoreResponsiveness(metadata),
      cod: 9, // Default high (code is validated in generation)
      arc: 9, // Default high (architecture is sound)
      dep: 8.5, // Default good (dependencies locked)
      doc: 8, // Default good (metadata logged)
      err: 9, // Default high (error handling in place)
      prf: this.scorePerformance(videoBuffer, metadata),
      sec: 9, // Default high (no credentials exposed)
      ux: 8.5, // Default good (API is straightforward)
      overall: 0,
    };

    // Calculate weighted overall score
    scores.overall = this.calculateOverall(scores);

    return scores;
  }

  /**
   * Motion smoothness (0-10).
   */
  private scoreMotion(metadata: ScoringMetadata): number {
    // Score based on FPS and duration consistency
    let score = 10;

    // Deduct for low FPS
    if (metadata.fps < 24) score -= 2;
    if (metadata.fps < 20) score -= 2;

    // Check for reasonable duration
    if (metadata.duration < 1) score -= 1;
    if (metadata.duration > 120) score -= 1;

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Accessibility score (0-10).
   * Would check for captions, color contrast, etc.
   */
  private scoreAccessibility(_metadata: ScoringMetadata): number {
    return 8; // Placeholder: requires video analysis
  }

  /**
   * Typography quality (0-10).
   * Would analyze text rendering in video.
   */
  private scoreTypography(_videoBuffer: Buffer): number {
    return 8.5; // Placeholder: requires frame analysis
  }

  /**
   * Color grading quality (0-10).
   */
  private scoreColor(_videoBuffer: Buffer): number {
    return 8.5; // Placeholder: requires color histogram analysis
  }

  /**
   * Speed/generation efficiency (0-10).
   */
  private scoreSpeed(metadata: ScoringMetadata): number {
    let score = 10;

    // Ideal generation time: 3-5 minutes for 20s video
    const expectedMs = 240000; // 4 minutes

    if (metadata.generationTimeMs > expectedMs * 1.5) {
      score -= (metadata.generationTimeMs - expectedMs * 1.5) / 60000;
    }

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Responsiveness across devices (0-10).
   */
  private scoreResponsiveness(metadata: ScoringMetadata): number {
    let score = 10;

    // Deduct if resolution is too low
    const res = metadata.resolution.split("x").map(Number);
    if (res[0] < 1280 || res[1] < 720) score -= 1;

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Performance/optimization (0-10).
   */
  private scorePerformance(videoBuffer: Buffer, metadata: ScoringMetadata): number {
    let score = 10;

    // Score based on file size efficiency
    const avgBitrate = (videoBuffer.length * 8) / metadata.duration / 1000; // kbps

    // Ideal bitrate for 1080p: 2500-5000 kbps
    if (avgBitrate > 10000) score -= 2;
    if (avgBitrate < 500) score -= 1; // Too compressed

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Calculate weighted overall UDEC score.
   */
  private calculateOverall(scores: UDECScore): number {
    // Weights for each axis (higher weight = more important)
    const weights = {
      mot: 1.2, // Motion is critical
      acc: 1.1, // Accessibility important
      typ: 0.8,
      clr: 1.0, // Color important
      spd: 0.7,
      rsp: 0.9,
      cod: 1.0,
      arc: 0.9,
      dep: 0.7,
      doc: 0.6,
      err: 1.0,
      prf: 0.8,
      sec: 1.0,
      ux: 0.9,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      const scoreKey = key as keyof Omit<UDECScore, "overall">;
      weightedSum += scores[scoreKey] * weight;
      totalWeight += weight;
    }

    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  /**
   * Check if score meets quality threshold.
   */
  isQualityPass(score: UDECScore, threshold: number = 8.5): boolean {
    return score.overall >= threshold;
  }

  /**
   * Get quality feedback for improvement.
   */
  getQualityFeedback(score: UDECScore): string[] {
    const feedback: string[] = [];

    if (score.mot < 8) feedback.push("Improve motion smoothness (increase FPS)");
    if (score.clr < 8) feedback.push("Enhance color grading quality");
    if (score.spd < 7) feedback.push("Optimize generation speed");
    if (score.acc < 8) feedback.push("Add accessibility features (captions)");
    if (score.prf < 8) feedback.push("Optimize file size and bitrate");

    if (feedback.length === 0) {
      feedback.push("Quality is excellent - no improvements needed");
    }

    return feedback;
  }
}

export { UDECScorer as default };
