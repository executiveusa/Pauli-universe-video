#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

const coverageDir = 'coverage';
const summaryPath = path.join(coverageDir, 'coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('❌ Coverage summary not found. Run: pnpm test:coverage');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
const total = summary.total;
const threshold = parseInt(process.argv[2] || '80');

const checks = {
  lines: total.lines.pct,
  statements: total.statements.pct,
  functions: total.functions.pct,
  branches: total.branches.pct,
};

let passed = true;
Object.entries(checks).forEach(([metric, pct]) => {
  const status = pct >= threshold ? '✓' : '✗';
  console.log(`${status} ${metric}: ${pct}%`);
  if (pct < threshold) passed = false;
});

if (!passed) {
  console.error(`\n❌ Coverage below ${threshold}%`);
  process.exit(1);
}

console.log(`\n✓ All coverage metrics above ${threshold}%`);
process.exit(0);
