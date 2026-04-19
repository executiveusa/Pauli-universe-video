import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPreset, listPresets, UDECScorer, CostTracker } from '../src/index';

describe('cinema-core', () => {
  describe('color-grader', () => {
    it('returns correct preset', () => {
      const preset = getPreset('reservoir_dogs');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('Reservoir Dogs');
      expect(preset?.contrast).toBeGreaterThan(1);
    });

    it('lists all presets', () => {
      const presets = listPresets();
      expect(presets.length).toBe(12);
      expect(presets.some(p => p.id === 'reservoir_dogs')).toBe(true);
    });
  });

  describe('udec-scorer', () => {
    it('scores UDEC correctly', () => {
      const scorer = new UDECScorer();
      const score = scorer.isQualityPass({ mot: 9, acc: 9, typ: 9, clr: 9, spd: 9, rsp: 9, cod: 9, arc: 9, dep: 9, doc: 9, err: 9, prf: 9, sec: 9, ux: 9, overall: 9 });
      expect(score).toBe(true);
    });

    it('identifies low-scoring axes', () => {
      const scorer = new UDECScorer();
      const score = { mot: 5, acc: 5, typ: 8, clr: 9, spd: 8, rsp: 9, cod: 8, arc: 9, dep: 8, doc: 9, err: 8, prf: 9, sec: 9, ux: 9, overall: 8 };
      expect(scorer.isQualityPass(score, 9)).toBe(false);
      expect(score.mot).toBeLessThan(8);
      expect(score.acc).toBeLessThan(8);
    });

    it('provides quality feedback', () => {
      const scorer = new UDECScorer();
      const score = { mot: 5, acc: 5, typ: 8, clr: 9, spd: 8, rsp: 9, cod: 8, arc: 9, dep: 8, doc: 9, err: 8, prf: 9, sec: 9, ux: 9, overall: 8 };
      const feedback = scorer.getQualityFeedback(score);
      expect(feedback.length).toBeGreaterThan(0);
      expect(feedback.some(f => f.toLowerCase().includes('motion'))).toBe(true);
    });
  });

  describe('cost-tracker', () => {
    let tracker: CostTracker;

    beforeEach(() => {
      vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
      vi.stubEnv('SUPABASE_KEY', 'test-key');

      vi.mock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => ({
          from: vi.fn().mockReturnValue({
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        })),
      }));

      tracker = new CostTracker('https://test.supabase.co', 'test-key');
    });

    it('logs cost entries', async () => {
      const cost = {
        fluxKeyframe: 0.5,
        seedanceVideo: 1.5,
        klingVideo: 0,
        higgsfield: 0.2,
        colorGrading: 0.1,
        storage: 0.1,
        total: 2.4,
      };

      await expect(tracker.logCost('test-id', cost)).resolves.not.toThrow();
    });

    it('enforces budget limits', async () => {
      const expensiveCost = {
        fluxKeyframe: 40,
        seedanceVideo: 40,
        klingVideo: 0,
        higgsfield: 0,
        colorGrading: 0,
        storage: 0,
        total: 80,
      };

      await expect(tracker.logCost('test-id', expensiveCost)).rejects.toThrow('Daily budget exceeded');
    });
  });
});
