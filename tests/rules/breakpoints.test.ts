import { describe, it, expect } from 'vitest';
import { checkBreakpoints } from '@rules/breakpoints.rules.js';
import type { BreakpointsData } from '@extractors/breakpoints.js';

function makeData(overrides: Partial<BreakpointsData> = {}): BreakpointsData {
  return {
    breakpoints: [
      { value: 640, query: '(min-width: 640px)', type: 'min-width', count: 5 },
      { value: 768, query: '(min-width: 768px)', type: 'min-width', count: 8 },
      {
        value: 1024,
        query: '(min-width: 1024px)',
        type: 'min-width',
        count: 3,
      },
    ],
    uniqueValues: [640, 768, 1024],
    strategy: 'mobile-first',
    knownSystem: null,
    ...overrides,
  };
}

describe('checkBreakpoints', () => {
  it('warns when no breakpoints found', () => {
    const v = checkBreakpoints(
      makeData({ breakpoints: [], uniqueValues: [], strategy: 'none' })
    );
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'breakpoints-none', severity: 'warn' })
    );
  });

  it('passes with mobile-first strategy', () => {
    const v = checkBreakpoints(makeData());
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'breakpoints-mobile-first',
        severity: 'pass',
      })
    );
  });

  it('warns with desktop-first strategy', () => {
    const v = checkBreakpoints(makeData({ strategy: 'desktop-first' }));
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'breakpoints-desktop-first',
        severity: 'warn',
      })
    );
  });

  it('warns with mixed strategy', () => {
    const v = checkBreakpoints(makeData({ strategy: 'mixed' }));
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'breakpoints-mixed-strategy',
        severity: 'warn',
      })
    );
  });

  it('passes with 4-6 breakpoints', () => {
    const v = checkBreakpoints(
      makeData({ uniqueValues: [480, 640, 768, 1024] })
    );
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'breakpoints-count-ok',
        severity: 'pass',
      })
    );
  });

  it('errors with 9+ breakpoints', () => {
    const values = [320, 375, 480, 576, 640, 768, 900, 1024, 1200];
    const v = checkBreakpoints(makeData({ uniqueValues: values }));
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'too-many-breakpoints',
        severity: 'error',
      })
    );
  });

  it('passes when known system detected', () => {
    const v = checkBreakpoints(makeData({ knownSystem: 'Tailwind CSS' }));
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'breakpoints-system',
        severity: 'pass',
      })
    );
  });
});
