import { describe, it, expect } from 'vitest';
import { calculateScore } from '@utils/score.js';
import type { ModuleReport } from '@/types.js';

function makeReport(
  name: string,
  pass: number,
  warn: number,
  error: number
): ModuleReport {
  const violations = [
    ...Array.from({ length: pass }, (_, i) => ({
      id: `${name}-pass-${i}`,
      severity: 'pass' as const,
      message: 'ok',
    })),
    ...Array.from({ length: warn }, (_, i) => ({
      id: `${name}-warn-${i}`,
      severity: 'warn' as const,
      message: 'warning',
    })),
    ...Array.from({ length: error }, (_, i) => ({
      id: `${name}-error-${i}`,
      severity: 'error' as const,
      message: 'error',
    })),
  ];
  return { name, violations };
}

describe('calculateScore', () => {
  it('returns 100 for all-pass module', () => {
    const result = calculateScore([makeReport('Colors', 5, 0, 0)]);
    expect(result.overall).toBe(100);
    expect(result.grade).toBe('A');
    expect(result.label).toBe('Excellent');
  });

  it('returns 0 for all-error module', () => {
    const result = calculateScore([makeReport('Colors', 0, 0, 5)]);
    expect(result.overall).toBe(0);
    expect(result.grade).toBe('F');
    expect(result.label).toBe('Critical');
  });

  it('returns 50 for all-warn module', () => {
    const result = calculateScore([makeReport('Colors', 0, 4, 0)]);
    expect(result.overall).toBe(50);
    expect(result.grade).toBe('D');
  });

  it('applies correct weights for known modules', () => {
    const reports = [
      makeReport('Colors', 5, 0, 0), // weight 20, score 100
      makeReport('Typography', 0, 0, 5), // weight 15, score 0
    ];
    const result = calculateScore(reports);
    // weighted: (100*20 + 0*15) / 35 = 57.14 → 57
    expect(result.overall).toBe(57);
  });

  it('handles empty violations (score = 100)', () => {
    const result = calculateScore([{ name: 'Colors', violations: [] }]);
    expect(result.overall).toBe(100);
  });

  it('returns correct module breakdown', () => {
    const result = calculateScore([makeReport('Colors', 3, 1, 1)]);
    const mod = result.modules[0];
    expect(mod.pass).toBe(3);
    expect(mod.warn).toBe(1);
    expect(mod.error).toBe(1);
    expect(mod.weight).toBe(20);
  });

  it('grade boundaries are correct', () => {
    // 90+ → A, 75-89 → B, 60-74 → C, 40-59 → D, <40 → F
    expect(calculateScore([makeReport('Colors', 9, 1, 0)]).grade).toBe('A'); // 95
    expect(calculateScore([makeReport('Colors', 7, 3, 0)]).grade).toBe('B'); // 85
    expect(calculateScore([makeReport('Colors', 5, 5, 0)]).grade).toBe('B'); // 75
    expect(calculateScore([makeReport('Colors', 3, 5, 2)]).grade).toBe('D'); // (3+2.5)/10 = 55% → D
  });
});
