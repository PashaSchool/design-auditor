import { BreakpointsData } from '@extractors/breakpoints.js';
import { Violation } from '@/types.js';

// Standard "round" breakpoint values
const STANDARD_VALUES = [
  320, 375, 480, 576, 640, 768, 800, 900, 960, 1024, 1200, 1280, 1440, 1536,
  1920,
];

function isStandard(value: number): boolean {
  return STANDARD_VALUES.some((s) => Math.abs(s - value) <= 4);
}

export function checkBreakpoints(data: BreakpointsData): Violation[] {
  const violations: Violation[] = [];
  const { breakpoints, uniqueValues, strategy, knownSystem } = data;

  if (breakpoints.length === 0) {
    violations.push({
      id: 'breakpoints-none',
      severity: 'warn',
      message: 'No media queries found — site may not be responsive',
    });
    return violations;
  }

  // ─── 1. Detected system ──────────────────────────────────────────────────────
  if (knownSystem) {
    violations.push({
      id: 'breakpoints-system',
      severity: 'pass',
      message: `Detected breakpoint system: ${knownSystem}`,
      hint: `Values: ${uniqueValues.join(', ')}px`,
    });
  }

  // ─── 2. Unique breakpoint count ──────────────────────────────────────────────
  if (uniqueValues.length > 8) {
    const nonStandard = uniqueValues.filter((v) => !isStandard(v));
    violations.push({
      id: 'too-many-breakpoints',
      severity: 'error',
      message: `${uniqueValues.length} unique breakpoints — rec. 4–6`,
      hint:
        nonStandard.length > 0
          ? `Non-standard values: ${nonStandard.join(', ')}px`
          : `All: ${uniqueValues.join(', ')}px`,
    });
  } else if (uniqueValues.length > 6) {
    violations.push({
      id: 'many-breakpoints',
      severity: 'warn',
      message: `${uniqueValues.length} breakpoints — rec. 4–5`,
      hint: `Values: ${uniqueValues.join(', ')}px`,
    });
  } else {
    violations.push({
      id: 'breakpoints-count-ok',
      severity: 'pass',
      message: `Breakpoints: ${uniqueValues.length} — OK (${uniqueValues.join(', ')}px)`,
    });
  }

  // ─── 3. mobile-first vs desktop-first strategy ───────────────────────────────
  if (strategy === 'mixed') {
    violations.push({
      id: 'breakpoints-mixed-strategy',
      severity: 'warn',
      message:
        'Mixed strategy: both min-width and max-width media queries detected',
      hint: 'Choose one approach: mobile-first (min-width) or desktop-first (max-width)',
    });
  } else if (strategy === 'mobile-first') {
    violations.push({
      id: 'breakpoints-mobile-first',
      severity: 'pass',
      message: 'Strategy: mobile-first (min-width) — recommended',
    });
  } else if (strategy === 'desktop-first') {
    violations.push({
      id: 'breakpoints-desktop-first',
      severity: 'warn',
      message: 'Strategy: desktop-first (max-width)',
      hint: 'Mobile-first (min-width) is more modern and scales better',
    });
  }

  // ─── 4. Non-standard values ──────────────────────────────────────────────────
  const nonStandard = uniqueValues.filter((v) => !isStandard(v));
  if (nonStandard.length > 2 && !knownSystem) {
    violations.push({
      id: 'breakpoints-non-standard',
      severity: 'warn',
      message: `${nonStandard.length} non-standard breakpoints: ${nonStandard.join(', ')}px`,
      hint: 'Non-standard values may indicate an ad-hoc approach without a system',
    });
  }

  return violations;
}
