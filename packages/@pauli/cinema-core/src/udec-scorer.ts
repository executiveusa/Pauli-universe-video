import type { UDECScore } from '@pauli/shared';
import { MIN_UDEC_SCORE } from '@pauli/shared';

export interface UDECScoreRequest {
  motion: number;
  accessibility: number;
  typography: number;
  color: number;
  speed: number;
  responsiveness: number;
  codeQuality: number;
  architecture: number;
  dependencies: number;
  documentation: number;
  errorHandling: number;
  performance: number;
  security: number;
  userExperience: number;
}

export function scoreUDEC(request: UDECScoreRequest): UDECScore {
  const motion = validateFiniteScore('scoreUDEC', 'motion', request.motion);
  const accessibility = validateFiniteScore('scoreUDEC', 'accessibility', request.accessibility);
  const typography = validateFiniteScore('scoreUDEC', 'typography', request.typography);
  const color = validateFiniteScore('scoreUDEC', 'color', request.color);
  const speed = validateFiniteScore('scoreUDEC', 'speed', request.speed);
  const responsiveness = validateFiniteScore('scoreUDEC', 'responsiveness', request.responsiveness);
  const codeQuality = validateFiniteScore('scoreUDEC', 'codeQuality', request.codeQuality);
  const architecture = validateFiniteScore('scoreUDEC', 'architecture', request.architecture);
  const dependencies = validateFiniteScore('scoreUDEC', 'dependencies', request.dependencies);
  const documentation = validateFiniteScore('scoreUDEC', 'documentation', request.documentation);
  const errorHandling = validateFiniteScore('scoreUDEC', 'errorHandling', request.errorHandling);
  const performance = validateFiniteScore('scoreUDEC', 'performance', request.performance);
  const security = validateFiniteScore('scoreUDEC', 'security', request.security);
  const userExperience = validateFiniteScore('scoreUDEC', 'userExperience', request.userExperience);

  const score: UDECScore = {
    mot: clampScore(motion),
    acc: clampScore(accessibility),
    typ: clampScore(typography),
    clr: clampScore(color),
    spd: clampScore(speed),
    rsp: clampScore(responsiveness),
    cod: clampScore(codeQuality),
    arc: clampScore(architecture),
    dep: clampScore(dependencies),
    doc: clampScore(documentation),
    err: clampScore(errorHandling),
    prf: clampScore(performance),
    sec: clampScore(security),
    ux: clampScore(userExperience),
    average: 0,
  };

  const sum = Object.values(score)
    .slice(0, 14)
    .reduce((a, b) => a + b, 0);
  score.average = sum / 14;

  return score;
}

export function isPassingScore(score: UDECScore): boolean {
  if (score.average < MIN_UDEC_SCORE) return false;

  const axes = [
    score.mot,
    score.acc,
    score.typ,
    score.clr,
    score.spd,
    score.rsp,
    score.cod,
    score.arc,
    score.dep,
    score.doc,
    score.err,
    score.prf,
    score.sec,
    score.ux,
  ];

  return axes.every((axis) => axis >= MIN_UDEC_SCORE);
}

export function getFailingAxes(score: UDECScore): string[] {
  const axes: { name: string; score: number }[] = [
    { name: 'Motion', score: score.mot },
    { name: 'Accessibility', score: score.acc },
    { name: 'Typography', score: score.typ },
    { name: 'Color', score: score.clr },
    { name: 'Speed', score: score.spd },
    { name: 'Responsiveness', score: score.rsp },
    { name: 'Code Quality', score: score.cod },
    { name: 'Architecture', score: score.arc },
    { name: 'Dependencies', score: score.dep },
    { name: 'Documentation', score: score.doc },
    { name: 'Error Handling', score: score.err },
    { name: 'Performance', score: score.prf },
    { name: 'Security', score: score.sec },
    { name: 'User Experience', score: score.ux },
  ];

  return axes.filter((axis) => axis.score < MIN_UDEC_SCORE).map((axis) => axis.name);
}

function clampScore(score: number): number {
  validateFiniteScore('clampScore', 'score', score);
  return Math.max(0, Math.min(10, score));
}

function validateFiniteScore(functionName: string, fieldName: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`[${functionName}] Invalid ${fieldName}: expected a finite number`);
  }

  return value;
}
