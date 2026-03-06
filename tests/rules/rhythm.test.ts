import { describe, it, expect } from 'vitest';
import { checkRhythm } from '@rules/rhythm.rules.js';
import type { RhythmData } from '@extractors/rhythm.js';

function makeData(overrides: Partial<RhythmData> = {}): RhythmData {
  return {
    bodyFontSize: 16,
    bodyLineHeight: 1.5,
    rhythmUnit: 24,
    lineHeights: [],
    margins: [],
    paddings: [],
    uniqueLineHeights: [24, 48],
    uniqueMargins: [8, 16, 24, 32],
    uniquePaddings: [8, 16, 24],
    ...overrides,
  };
}

describe('checkRhythm', () => {
  describe('rhythm unit', () => {
    it('passes when rhythm unit is multiple of 4', () => {
      const v = checkRhythm(makeData());
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'rhythm-unit-ok', severity: 'pass' })
      );
    });

    it('warns when rhythm unit is not multiple of 4', () => {
      const v = checkRhythm(makeData({ rhythmUnit: 23 }));
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'rhythm-unit-not-round',
          severity: 'warn',
        })
      );
    });
  });

  describe('line-heights rhythm', () => {
    it('passes when 80%+ match rhythm unit', () => {
      const v = checkRhythm(
        makeData({ uniqueLineHeights: [24, 48, 72, 96, 20] })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'line-heights-rhythm-ok',
          severity: 'pass',
        })
      );
    });

    it('errors when <50% match rhythm unit', () => {
      const v = checkRhythm(
        makeData({ uniqueLineHeights: [17, 19, 22, 25, 24] })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'line-heights-rhythm-error',
          severity: 'error',
        })
      );
    });
  });

  describe('spacing grid', () => {
    it('passes when spacing follows 8px grid', () => {
      const v = checkRhythm(
        makeData({
          uniqueMargins: [8, 16, 24, 32, 48],
          uniquePaddings: [8, 16, 24],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'spacing-grid-ok', severity: 'pass' })
      );
    });

    it('errors when <60% divisible by 4px', () => {
      // remainder=2 mod 4 fails the ±1px tolerance check
      const v = checkRhythm(
        makeData({
          uniqueMargins: [6, 10, 14, 18, 22],
          uniquePaddings: [2, 6, 10, 14, 18],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'spacing-grid-error',
          severity: 'error',
        })
      );
    });
  });

  describe('margin count', () => {
    it('passes with <= 10 unique margins', () => {
      const v = checkRhythm(
        makeData({ uniqueMargins: [4, 8, 12, 16, 24, 32] })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'margins-ok', severity: 'pass' })
      );
    });

    it('errors with 16+ unique margins', () => {
      const margins = Array.from({ length: 18 }, (_, i) => i * 4);
      const v = checkRhythm(makeData({ uniqueMargins: margins }));
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'too-many-margins',
          severity: 'error',
        })
      );
    });
  });
});
