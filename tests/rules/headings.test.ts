import { describe, it, expect } from 'vitest';
import { checkHeadings } from '@rules/headings.rules.js';
import type { HeadingsData, HeadingEntry } from '@extractors/headings.js';

function makeHeading(
  level: number,
  text: string,
  fontSize: number,
  domIndex: number
): HeadingEntry {
  return {
    level,
    tag: `h${level}`,
    text,
    fontSize,
    fontWeight: '700',
    domIndex,
  };
}

function makeData(overrides: Partial<HeadingsData> = {}): HeadingsData {
  return {
    headings: [
      makeHeading(1, 'Main Title', 48, 0),
      makeHeading(2, 'Subtitle', 32, 1),
      makeHeading(3, 'Section', 24, 2),
    ],
    h1Count: 1,
    skippedLevels: [],
    sizeInversions: [],
    levelSizes: { 1: [48], 2: [32], 3: [24] },
    hasLogicalOrder: true,
    ...overrides,
  };
}

describe('checkHeadings', () => {
  it('warns when no headings found', () => {
    const v = checkHeadings(makeData({ headings: [], h1Count: 0 }));
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'headings-none', severity: 'warn' })
    );
  });

  describe('H1 count', () => {
    it('passes with exactly 1 H1', () => {
      const v = checkHeadings(makeData());
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'h1-ok', severity: 'pass' })
      );
    });

    it('errors with 0 H1s', () => {
      const v = checkHeadings(
        makeData({
          headings: [makeHeading(2, 'Sub', 32, 0)],
          h1Count: 0,
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'no-h1', severity: 'error' })
      );
    });

    it('errors with multiple H1s', () => {
      const v = checkHeadings(
        makeData({
          headings: [
            makeHeading(1, 'First', 48, 0),
            makeHeading(1, 'Second', 48, 1),
          ],
          h1Count: 2,
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'multiple-h1', severity: 'error' })
      );
    });
  });

  describe('hierarchy', () => {
    it('passes with no skipped levels', () => {
      const v = checkHeadings(makeData());
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'heading-hierarchy-ok',
          severity: 'pass',
        })
      );
    });

    it('errors with skipped levels', () => {
      const v = checkHeadings(
        makeData({
          skippedLevels: [{ from: 1, to: 3, text: 'Skipped H2' }],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'skipped-heading-levels',
          severity: 'error',
        })
      );
    });
  });

  describe('visual size hierarchy', () => {
    it('passes when sizes decrease with level', () => {
      const v = checkHeadings(makeData());
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'heading-sizes-ok',
          severity: 'pass',
        })
      );
    });

    it('errors when H2 is larger than H1', () => {
      const h1 = makeHeading(1, 'Small H1', 24, 0);
      const h2 = makeHeading(2, 'Big H2', 48, 1);
      const v = checkHeadings(
        makeData({
          sizeInversions: [{ a: h1, b: h2 }],
          levelSizes: { 1: [24], 2: [48] },
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'heading-size-inversion',
          severity: 'error',
        })
      );
    });
  });

  it('warns when H1 is not first heading', () => {
    const v = checkHeadings(makeData({ hasLogicalOrder: false }));
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'h1-not-first', severity: 'warn' })
    );
  });
});
