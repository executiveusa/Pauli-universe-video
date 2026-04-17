import { UDECScorer, UDECScore } from "./udec-scorer";
import { z } from "zod";

export interface QualityResult {
  jobId: string;
  status: "approved" | "rejected" | "pending_review";
  score: UDECScore;
  feedback: string[];
  shouldRetry: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface QualityGateConfig {
  passThreshold?: number;
  maxRetries?: number;
  autoApproveAbove?: number;
}

/**
 * Quality gate with automatic rejection and retry logic.
 * Ensures all videos meet UDEC ≥8.5 quality threshold.
 */
export class QualityGate {
  private scorer: UDECScorer;
  private passThreshold = 8.5;
  private maxRetries = 3;
  private autoApproveAbove = 9.0;
  private retryCount = new Map<string, number>();

  constructor(config: QualityGateConfig = {}) {
    this.scorer = new UDECScorer();
    if (config.passThreshold) this.passThreshold = config.passThreshold;
    if (config.maxRetries) this.maxRetries = config.maxRetries;
    if (config.autoApproveAbove) this.autoApproveAbove = config.autoApproveAbove;
  }

  /**
   * Process video through quality gate.
   */
  async processVideo(
    jobId: string,
    videoBuffer: Buffer,
    metadata: {
      videoSize: number;
      duration: number;
      fps: number;
      resolution: string;
      codec: string;
      generationTimeMs: number;
    }
  ): Promise<QualityResult> {
    const retryNum = this.retryCount.get(jobId) || 0;

    // Score the video
    const score = await this.scorer.scoreVideo(videoBuffer, metadata);
    const feedback = this.scorer.getQualityFeedback(score);

    // Determine status
    let status: "approved" | "rejected" | "pending_review" = "rejected";
    let shouldRetry = false;

    if (score.overall >= this.autoApproveAbove) {
      status = "approved";
    } else if (score.overall >= this.passThreshold) {
      status = "approved";
    } else if (retryNum < this.maxRetries) {
      status = "rejected";
      shouldRetry = true;
      this.retryCount.set(jobId, retryNum + 1);
    } else {
      status = "pending_review";
    }

    return {
      jobId,
      status,
      score,
      feedback,
      shouldRetry,
      retryCount: retryNum,
      maxRetries: this.maxRetries,
    };
  }

  /**
   * Reset retry count for a job.
   */
  resetRetryCount(jobId: string): void {
    this.retryCount.delete(jobId);
  }

  /**
   * Get retry count for a job.
   */
  getRetryCount(jobId: string): number {
    return this.retryCount.get(jobId) || 0;
  }

  /**
   * Batch process multiple videos.
   */
  async batchProcess(
    jobs: Array<{
      jobId: string;
      videoBuffer: Buffer;
      metadata: {
        videoSize: number;
        duration: number;
        fps: number;
        resolution: string;
        codec: string;
        generationTimeMs: number;
      };
    }>
  ): Promise<QualityResult[]> {
    const results: QualityResult[] = [];

    for (const job of jobs) {
      const result = await this.processVideo(
        job.jobId,
        job.videoBuffer,
        job.metadata
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Get statistics about processed videos.
   */
  getStats(results: QualityResult[]): {
    approved: number;
    rejected: number;
    pendingReview: number;
    averageScore: number;
  } {
    const approved = results.filter((r) => r.status === "approved").length;
    const rejected = results.filter((r) => r.status === "rejected").length;
    const pendingReview = results.filter((r) => r.status === "pending_review")
      .length;
    const averageScore =
      results.reduce((sum, r) => sum + r.score.overall, 0) / results.length;

    return {
      approved,
      rejected,
      pendingReview,
      averageScore,
    };
  }
}

export { QualityGate as default };
