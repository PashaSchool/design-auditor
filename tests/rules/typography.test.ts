import { describe, it, expect } from 'vitest';
import { checkTypography } from '@rules/typography.rules.js';
import type { TypographyData } from '@extractors/typography.js';

function makeData(overrides: Partial<TypographyData> = {}): TypographyData {
  return {
    fonts: [
      {
        family: 'Inter',
        sizes: ['16px'],
        weights: ['400'],
        lineHeights: ['1.5'],
        usedInTags: ['p'],
        count: 100,
      },
    ],
    allSizes: ['14px', '16px', '20px', '24px'],
    allLineHeights: ['1.4', '1.5', '1.6'],
    ...overrides,
  };
}

describe('checkTypography', () => {
  describe('font families', () => {
    it('passes with 1 custom font', () => {
      const v = checkTypography(makeData());
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'font-families-ok', severity: 'pass' })
      );
    });

    it('warns with 3 custom fonts', () => {
      const v = checkTypography(
        makeData({
          fonts: [
            { family: 'Inter', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
            { family: 'Roboto', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
            { family: 'Poppins', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
          ],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'many-font-families', severity: 'warn' })
      );
    });

    it('errors with 4+ custom fonts', () => {
      const v = checkTypography(
        makeData({
          fonts: [
            { family: 'Inter', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
            { family: 'Roboto', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
            { family: 'Poppins', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
            { family: 'Montserrat', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
          ],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'too-many-font-families',
          severity: 'error',
        })
      );
    });

    it('ignores system fonts', () => {
      const v = checkTypography(
        makeData({
          fonts: [
            { family: 'Inter', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
            { family: 'Arial', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
            { family: 'sans-serif', sizes: [], weights: [], lineHeights: [], usedInTags: [], count: 1 },
          ],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'font-families-ok', severity: 'pass' })
      );
    });
  });

  describe('font sizes', () => {
    it('passes with <= 7 sizes', () => {
      const v = checkTypography(
        makeData({ allSizes: ['12px', '14px', '16px', '20px', '24px'] })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'font-sizes-ok', severity: 'pass' })
      );
    });

    it('warns with 8-10 sizes', () => {
      const sizes = Array.from({ length: 9 }, (_, i) => `${12 + i * 2}px`);
      const v = checkTypography(makeData({ allSizes: sizes }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'many-font-sizes', severity: 'warn' })
      );
    });

    it('errors with 11+ sizes', () => {
      const sizes = Array.from({ length: 12 }, (_, i) => `${10 + i * 2}px`);
      const v = checkTypography(makeData({ allSizes: sizes }));
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'too-many-font-sizes',
          severity: 'error',
        })
      );
    });
  });

  describe('modular scale', () => {
    it('does not warn for modular scale sizes', () => {
      // Major Third (1.25): 12 → 15 → 18.75 → 23.4
      const v = checkTypography(
        makeData({ allSizes: ['12px', '15px', '18.75px', '23.4px'] })
      );
      expect(v.find((v) => v.id === 'no-modular-scale')).toBeUndefined();
    });

    it('warns for non-modular sizes', () => {
      const v = checkTypography(
        makeData({ allSizes: ['12px', '14px', '22px', '40px'] })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'no-modular-scale', severity: 'warn' })
      );
    });
  });

  describe('line-heights', () => {
    it('passes with <= 5 unique line-heights', () => {
      const v = checkTypography(
        makeData({ allLineHeights: ['1.2', '1.4', '1.5'] })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'line-heights-ok', severity: 'pass' })
      );
    });

    it('errors with 9+ unique line-heights', () => {
      const lhs = Array.from({ length: 10 }, (_, i) => `${1 + i * 0.1}`);
      const v = checkTypography(makeData({ allLineHeights: lhs }));
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'too-many-line-heights',
          severity: 'error',
        })
      );
    });

    it('ignores "normal" line-height', () => {
      const lhs = ['normal', '1.2', '1.4', '1.5'];
      const v = checkTypography(makeData({ allLineHeights: lhs }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'line-heights-ok', severity: 'pass' })
      );
    });
  });
});
