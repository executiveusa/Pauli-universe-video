import {
  calculateUDECAverage,
  formatCost,
  calculateGameScore,
  generateUUID,
  isValidEmail,
  clamp,
} from '../src/utils';

describe('calculateUDECAverage', () => {
  it('calculates average of 14 UDEC axes', () => {
    const scores = {
      mot: 9,
      acc: 9,
      typ: 8,
      clr: 9,
      spd: 8,
      rsp: 9,
      cod: 8,
      arc: 9,
      dep: 8,
      doc: 9,
      err: 8,
      prf: 9,
      sec: 9,
      ux: 9,
    };
    const avg = calculateUDECAverage(scores);
    expect(avg).toBeCloseTo(8.64, 1);
  });
});

describe('formatCost', () => {
  it('formats currency correctly', () => {
    expect(formatCost(3.1)).toBe('$3.10');
    expect(formatCost(0.5)).toBe('$0.50');
  });
});

describe('calculateGameScore', () => {
  it('calculates score with difficulty multiplier', () => {
    const score = calculateGameScore(100, 2, 0);
    expect(score).toBe(150);
  });

  it('applies hint penalty', () => {
    const score = calculateGameScore(100, 1, 2);
    expect(score).toBe(80);
  });

  it('never returns negative score', () => {
    const score = calculateGameScore(10, 1, 10);
    expect(score).toBe(0);
  });
});

describe('generateUUID', () => {
  it('generates valid UUID format', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });
});

describe('isValidEmail', () => {
  it('validates correct email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(isValidEmail('invalid.email')).toBe(false);
  });
});

describe('clamp', () => {
  it('clamps value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
  });
});
