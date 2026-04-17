import { describe, it, expect, beforeEach, vi } from "vitest";
import { CostTracker } from "./cost-tracker";

const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe("CostTracker", () => {
  let tracker: CostTracker;

  beforeEach(() => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_KEY = "test-key";
    tracker = new CostTracker();
    vi.clearAllMocks();
  });

  describe("logCost", () => {
    it("logs cost entry", async () => {
      const mockInsert = vi.fn().mockReturnValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const cost = {
        fluxKeyframe: 0.5,
        seedanceVideo: 0.15,
        klingVideo: 0,
        higgsfield: 0.2,
        colorGrading: 0.1,
        storage: 0.1,
        total: 1.05,
      };

      await tracker.logCost("job-1", cost);

      expect(tracker.getDailyCost()).toBeCloseTo(1.05, 2);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("throws on daily budget exceeded", async () => {
      tracker.setDailyBudget(1.0);

      const cost = {
        fluxKeyframe: 0.6,
        seedanceVideo: 0.6,
        klingVideo: 0,
        higgsfield: 0,
        colorGrading: 0,
        storage: 0,
        total: 1.2,
      };

      await expect(tracker.logCost("job-1", cost)).rejects.toThrow(
        "budget exceeded"
      );
    });

    it("throws on monthly budget exceeded", async () => {
      tracker.setMonthlyBudget(1.5);

      const cost = {
        fluxKeyframe: 0.5,
        seedanceVideo: 0.5,
        klingVideo: 0,
        higgsfield: 0.5,
        colorGrading: 0,
        storage: 0,
        total: 1.5,
      };

      const mockInsert = vi.fn().mockReturnValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      await tracker.logCost("job-1", cost);

      await expect(tracker.logCost("job-2", cost)).rejects.toThrow(
        "budget exceeded"
      );
    });
  });

  describe("budget tracking", () => {
    it("calculates remaining budgets", async () => {
      tracker.setDailyBudget(10);
      const cost = {
        fluxKeyframe: 2,
        seedanceVideo: 0,
        klingVideo: 0,
        higgsfield: 0,
        colorGrading: 0,
        storage: 0,
        total: 2,
      };

      const mockInsert = vi.fn().mockReturnValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      await tracker.logCost("job-1", cost);

      expect(tracker.getRemainingDailyBudget()).toBe(8);
    });

    it("resets daily budget", async () => {
      const cost = {
        fluxKeyframe: 1,
        seedanceVideo: 0,
        klingVideo: 0,
        higgsfield: 0,
        colorGrading: 0,
        storage: 0,
        total: 1,
      };

      const mockInsert = vi.fn().mockReturnValue({
        data: null,
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      await tracker.logCost("job-1", cost);
      expect(tracker.getDailyCost()).toBe(1);

      tracker.resetDailyBudget();
      expect(tracker.getDailyCost()).toBe(0);
    });
  });

  describe("estimateCost", () => {
    it("calculates total cost", () => {
      const estimate = tracker.estimateCost({
        fluxKeyframe: 0.5,
        seedanceVideo: 0.15,
        higgsfield: 0.2,
      });

      expect(estimate).toBeCloseTo(0.85, 2);
    });
  });
});
