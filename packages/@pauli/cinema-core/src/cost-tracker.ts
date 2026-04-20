import type { CostTracker } from '@pauli/shared';
import { COST_PER_VIDEO } from '@pauli/shared';

export interface CostEstimate {
  fluxCost: number;
  klingCost: number;
  modalComputeCost: number;
  colorGradingCost: number;
  higgsfieldCost: number;
  infinityCost: number;
  infrastructureCost: number;
  totalCost: number;
}

export function estimateCost(
  durationSeconds: number,
  useColorGrading: boolean = true,
  useHiggsfield: boolean = true,
  useInfinity: boolean = false
): CostEstimate {
  validateNonNegativeFiniteNumber('estimateCost', 'durationSeconds', durationSeconds);
  const durationMinutes = durationSeconds / 60;

  const fluxCost = durationMinutes * COST_PER_VIDEO.FLUX_GENERATION;
  const klingCost = durationMinutes * COST_PER_VIDEO.KLING_RENDERING;
  const colorGradingCost = useColorGrading ? COST_PER_VIDEO.COLOR_GRADING : 0;
  const higgsfieldCost = useHiggsfield ? COST_PER_VIDEO.HIGGSFIELD_CONSISTENCY : 0;
  const infinityCost = useInfinity ? COST_PER_VIDEO.INFINITY_EXTENSION : 0;
  const infrastructureCost = COST_PER_VIDEO.INFRASTRUCTURE;
  const modalComputeCost = (fluxCost + klingCost) * 0.1;

  const totalCost =
    fluxCost +
    klingCost +
    colorGradingCost +
    higgsfieldCost +
    infinityCost +
    infrastructureCost +
    modalComputeCost;

  const computedValues: Record<string, number> = {
    fluxCost,
    klingCost,
    modalComputeCost,
    colorGradingCost,
    higgsfieldCost,
    infinityCost,
    infrastructureCost,
    totalCost,
  };

  for (const [key, value] of Object.entries(computedValues)) {
    validateNonNegativeFiniteNumber('estimateCost', key, value);
  }

  return {
    fluxCost,
    klingCost,
    modalComputeCost,
    colorGradingCost,
    higgsfieldCost,
    infinityCost,
    infrastructureCost,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

export function trackCost(videoId: string, estimate: CostEstimate): CostTracker {
  const estimateValues: Record<string, number> = {
    fluxCost: estimate.fluxCost,
    klingCost: estimate.klingCost,
    modalComputeCost: estimate.modalComputeCost,
    colorGradingCost: estimate.colorGradingCost,
    higgsfieldCost: estimate.higgsfieldCost,
    infinityCost: estimate.infinityCost,
    infrastructureCost: estimate.infrastructureCost,
    totalCost: estimate.totalCost,
  };

  for (const [key, value] of Object.entries(estimateValues)) {
    validateNonNegativeFiniteNumber('trackCost', key, value);
  }

  return {
    videoId,
    fluxCost: estimate.fluxCost,
    klingCost: estimate.klingCost,
    modalComputeCost: estimate.modalComputeCost,
    totalCost: estimate.totalCost,
    timestamp: new Date(),
  };
}

export function budgetRemaining(spent: number, budget: number): number {
  validateNonNegativeFiniteNumber('budgetRemaining', 'spent', spent);
  validateNonNegativeFiniteNumber('budgetRemaining', 'budget', budget);
  return Math.max(0, budget - spent);
}

export function isWithinBudget(spent: number, budget: number): boolean {
  validateNonNegativeFiniteNumber('isWithinBudget', 'spent', spent);
  validateNonNegativeFiniteNumber('isWithinBudget', 'budget', budget);
  return spent <= budget;
}

export function projectedCostForMonth(dailyAverage: number, daysInMonth: number = 30): number {
  validateNonNegativeFiniteNumber('projectedCostForMonth', 'dailyAverage', dailyAverage);
  validateNonNegativeFiniteNumber('projectedCostForMonth', 'daysInMonth', daysInMonth);
  return dailyAverage * daysInMonth;
}

function validateNonNegativeFiniteNumber(
  functionName: string,
  argumentName: string,
  value: number
): void {
  if (!Number.isFinite(value)) {
    throw new Error(
      `[${functionName}] Invalid ${argumentName}: expected a finite number`
    );
  }

  if (value < 0) {
    throw new Error(
      `[${functionName}] Invalid ${argumentName}: expected a finite number >= 0`
    );
  }
}
