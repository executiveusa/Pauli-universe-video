import {
  getPreset,
  listPresets,
  scoreUDEC,
  isPassingScore,
  getFailingAxes,
  estimateCost,
  trackCost,
  calculateInfinitySegments,
} from '../src/index';

describe('cinema-core', () => {
  describe('color-grader', () => {
    it('returns correct preset', () => {
      const preset = getPreset('cinematic-gold');
      expect(preset.name).toBe('cinematic-gold');
      expect(preset.contrast).toBeGreaterThan(1);
    });

    it('lists all presets', () => {
      const presets = listPresets();
      expect(presets.length).toBe(12);
      expect(presets).toContain('cinematic-gold');
    });
  });

  describe('udec-scorer', () => {
    it('scores UDEC correctly', () => {
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

      expect(score.average).toBeGreaterThan(8.5);
      expect(isPassingScore(score)).toBe(true);
    });

    it('identifies failing axes', () => {
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

      expect(isPassingScore(score)).toBe(false);
      const failing = getFailingAxes(score);
      expect(failing).toContain('Motion');
      expect(failing).toContain('Accessibility');
    });
  });

  describe('cost-tracker', () => {
    it('estimates cost correctly', () => {
      const estimate = estimateCost(60, true, true, false);
      expect(estimate.totalCost).toBeGreaterThan(0);
      expect(estimate.fluxCost).toBeGreaterThan(0);
      expect(estimate.klingCost).toBeGreaterThan(0);
    });

    it('tracks cost with timestamp', () => {
      const estimate = estimateCost(60);
      const tracked = trackCost('test-id', estimate);
      expect(tracked.videoId).toBe('test-id');
      expect(tracked.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('infinite-gen', () => {
    it('calculates infinity segments', () => {
      const segments = calculateInfinitySegments(100, 10);
      expect(segments).toBe(10);
    });

    it('calculates segments with ceiling', () => {
      const segments = calculateInfinitySegments(95, 10);
      expect(segments).toBe(10);
    });
  });
});
