import { describe, it, expect } from '@jest/globals';
import {
  getPreset,
  listPresets,
  scoreUDEC,
  isPassingScore,
  getFailingAxes,
  estimateCost,
  isWithinBudget,
  budgetRemaining,
} from '../src/index';

describe('cinema-core public API', () => {
  describe('color presets', () => {
    it('returns a known preset by id', () => {
      const preset = getPreset('noir-contrast');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('noir-contrast');
      expect(preset.contrast).toBeGreaterThan(1);
    });

    it('lists all cinematic presets', () => {
      const presets = listPresets();
      expect(presets.length).toBe(12);
      expect(presets.includes('noir-contrast')).toBe(true);
    });
  });

  describe('udec scoring', () => {
    it('passes quality when all axes are above threshold', () => {
      const score = scoreUDEC({
        motion: 9,
        accessibility: 9,
        typography: 9,
        color: 9,
        speed: 9,
        responsiveness: 9,
        codeQuality: 9,
        architecture: 9,
        dependencies: 9,
        documentation: 9,
        errorHandling: 9,
        performance: 9,
        security: 9,
        userExperience: 9,
      });

      expect(isPassingScore(score)).toBe(true);
    });

    it('returns failing axes when motion and accessibility are weak', () => {
      const score = scoreUDEC({
        motion: 5,
        accessibility: 5,
        typography: 8,
        color: 9,
        speed: 8,
        responsiveness: 9,
        codeQuality: 8,
        architecture: 9,
        dependencies: 8,
        documentation: 9,
        errorHandling: 8,
        performance: 9,
        security: 9,
        userExperience: 9,
      });

      const failing = getFailingAxes(score);
      expect(isPassingScore(score)).toBe(false);
      expect(failing).toContain('Motion');
      expect(failing).toContain('Accessibility');
    });
  });

  describe('cost tracking utilities', () => {
    it('estimates cost with expected positive totals', () => {
      const estimate = estimateCost(20, true, true, false);

      expect(estimate.totalCost).toBeGreaterThan(0);
      expect(estimate.fluxCost).toBeGreaterThan(0);
      expect(estimate.klingCost).toBeGreaterThan(0);
    });

    it('enforces budget utility logic', () => {
      expect(isWithinBudget(25, 50)).toBe(true);
      expect(isWithinBudget(55, 50)).toBe(false);
      expect(budgetRemaining(12.5, 50)).toBeCloseTo(37.5);
      expect(budgetRemaining(120, 50)).toBe(0);
    });
  });
});
