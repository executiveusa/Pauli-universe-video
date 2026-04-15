import type { CostTracker } from '@pauli/shared';
import { COST_PER_VIDEO } from '@pauli/shared';

export interface CostEstimate {
  fluxCost: number;
  klingCost: number;
  modalComputeCost: number;
  colorGradingCost: number;
  higgsfielCost: number;
  infinityCost: number;
  infrastructureCost: number;
  totalCost: number;
}

export function estimateCost(
  durationSeconds: number,
  useColorGrading: boolean = true,
  useHighgsfield: boolean = true,
  useInfinity: boolean = false
): CostEstimate {
  const durationMinutes = durationSeconds / 60;

  const fluxCost = durationMinutes * COST_PER_VIDEO.FLUX_GENERATION;
  const klingCost = durationMinutes * COST_PER_VIDEO.KLING_RENDERING;
  const colorGradingCost = useColorGrading ? COST_PER_VIDEO.COLOR_GRADING : 0;
  const higgsfielCost = useHighgsfield ? COST_PER_VIDEO.HIGGSFIELD_CONSISTENCY : 0;
  const infinityCost = useInfinity ? COST_PER_VIDEO.INFINITY_EXTENSION : 0;
  const infrastructureCost = COST_PER_VIDEO.INFRASTRUCTURE;
  const modalComputeCost = (fluxCost + klingCost) * 0.1;

  const totalCost =
    fluxCost +
    klingCost +
    colorGradingCost +
    higgsfielCost +
    infinityCost +
    infrastructureCost +
    modalComputeCost;

  return {
    fluxCost,
    klingCost,
    modalComputeCost,
    colorGradingCost,
    higgsfielCost,
    infinityCost,
    infrastructureCost,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}

export function trackCost(videoId: string, estimate: CostEstimate): CostTracker {
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
  return Math.max(0, budget - spent);
}

export function isWithinBudget(spent: number, budget: number): boolean {
  return spent <= budget;
}

export function projectedCostForMonth(dailyAverage: number, daysInMonth: number = 30): number {
  return dailyAverage * daysInMonth;
}
