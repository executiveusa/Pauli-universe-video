import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface VideoCost {
  fluxKeyframe: number;
  seedanceVideo: number;
  klingVideo: number;
  higgsfield: number;
  colorGrading: number;
  storage: number;
  total: number;
}

export interface CostEntry {
  jobId: string;
  timestamp: Date;
  cost: VideoCost;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cost tracker for video generation pipeline.
 * Logs costs per job and enforces budget limits.
 */
export class CostTracker {
  private supabase: SupabaseClient;
  private table = "cost_logs";
  private dailyBudget = 50;
  private monthlyBudget = 1000;
  private dailyCost = 0;
  private monthlyCost = 0;
  private lastResetDate = new Date();

  constructor(
    supabaseUrl?: string,
    supabaseKey?: string
  ) {
    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_KEY;

    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_KEY required");
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Log a cost entry.
   */
  async logCost(jobId: string, cost: VideoCost, userId?: string): Promise<void> {
    // Check daily budget
    if (this.dailyCost + cost.total > this.dailyBudget) {
      throw new Error(
        `Daily budget exceeded: $${(this.dailyCost + cost.total).toFixed(2)}/$${this.dailyBudget}`
      );
    }

    // Check monthly budget
    if (this.monthlyCost + cost.total > this.monthlyBudget) {
      throw new Error(
        `Monthly budget exceeded: $${(this.monthlyCost + cost.total).toFixed(2)}/$${this.monthlyBudget}`
      );
    }

    // Update in-memory tracking
    this.dailyCost += cost.total;
    this.monthlyCost += cost.total;

    // Log to Supabase
    const { error } = await this.supabase.from(this.table).insert([
      {
        job_id: jobId,
        timestamp: new Date(),
        cost: cost,
        user_id: userId,
      },
    ]);

    if (error) {
      throw new Error(`Failed to log cost: ${error.message}`);
    }
  }

  /**
   * Get daily cost.
   */
  getDailyCost(): number {
    return this.dailyCost;
  }

  /**
   * Get monthly cost.
   */
  getMonthlyCost(): number {
    return this.monthlyCost;
  }

  /**
   * Get remaining daily budget.
   */
  getRemainingDailyBudget(): number {
    return Math.max(0, this.dailyBudget - this.dailyCost);
  }

  /**
   * Get remaining monthly budget.
   */
  getRemainingMonthlyBudget(): number {
    return Math.max(0, this.monthlyBudget - this.monthlyCost);
  }

  /**
   * Set daily budget.
   */
  setDailyBudget(budget: number): void {
    if (budget <= 0) {
      throw new Error("Budget must be positive");
    }
    this.dailyBudget = budget;
  }

  /**
   * Set monthly budget.
   */
  setMonthlyBudget(budget: number): void {
    if (budget <= 0) {
      throw new Error("Budget must be positive");
    }
    this.monthlyBudget = budget;
  }

  /**
   * Reset daily cost (call once per day).
   */
  resetDailyBudget(): void {
    this.dailyCost = 0;
    this.lastResetDate = new Date();
  }

  /**
   * Reset monthly cost (call once per month).
   */
  resetMonthlyBudget(): void {
    this.monthlyCost = 0;
  }

  /**
   * Get cost summary.
   */
  async getSummary(daysBack: number = 1): Promise<{
    totalCost: number;
    averagePerJob: number;
    jobCount: number;
  }> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysBack);

    const { data, error } = await this.supabase
      .from(this.table)
      .select("cost")
      .gte("timestamp", sinceDate.toISOString());

    if (error) {
      throw new Error(`Failed to get summary: ${error.message}`);
    }

    const costs = (data || []).map((row: { cost: VideoCost }) => row.cost);
    const totalCost = costs.reduce((sum, c) => sum + c.total, 0);
    const jobCount = costs.length;
    const averagePerJob = jobCount > 0 ? totalCost / jobCount : 0;

    return {
      totalCost,
      averagePerJob,
      jobCount,
    };
  }

  /**
   * Estimate cost for a job.
   */
  estimateCost(components: Partial<VideoCost>): number {
    return (
      (components.fluxKeyframe || 0) +
      (components.seedanceVideo || 0) +
      (components.klingVideo || 0) +
      (components.higgsfield || 0) +
      (components.colorGrading || 0) +
      (components.storage || 0)
    );
  }
}

export { CostTracker as default };
