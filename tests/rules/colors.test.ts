import { describe, it, expect } from 'vitest';
import { checkColors } from '@rules/colors.rules.js';
import {
  rgbToLab,
  type RGB,
  type ColorEntry,
  type ColorCluster,
} from '@utils/color.js';
import type { ColorsData } from '@extractors/colors.js';

function makeEntry(r: number, g: number, b: number, count = 1): ColorEntry {
  const rgb: RGB = { r, g, b, a: 1 };
  return {
    raw: `rgb(${r},${g},${b})`,
    rgb,
    lab: rgbToLab(rgb),
    count,
    properties: ['color'],
    tags: ['div'],
  };
}

function makeCluster(entries: ColorEntry[]): ColorCluster {
  return {
    representative: entries[0],
    members: entries.slice(1),
    totalCount: entries.reduce((s, e) => s + e.count, 0),
  };
}

function makeData(overrides: Partial<ColorsData> = {}): ColorsData {
  return {
    all: [makeEntry(26, 115, 232, 50)],
    clusters: [],
    brandColors: [],
    contrastPairs: [],
    cssVarCoverage: 50,
    ...overrides,
  };
}

describe('checkColors', () => {
  describe('unique color count', () => {
    it('passes with <= 15 colors', () => {
      const all = Array.from({ length: 10 }, (_, i) => makeEntry(i * 25, 0, 0));
      const v = checkColors(makeData({ all }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'colors-count-ok', severity: 'pass' })
      );
    });

    it('warns with 16-30 colors', () => {
      const all = Array.from({ length: 20 }, (_, i) =>
        makeEntry(i * 12, i * 5, 0)
      );
      const v = checkColors(makeData({ all }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'many-colors', severity: 'warn' })
      );
    });

    it('errors with 31+ colors', () => {
      const all = Array.from({ length: 35 }, (_, i) =>
        makeEntry(i * 7, i * 3, i * 2)
      );
      const v = checkColors(makeData({ all }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'too-many-colors', severity: 'error' })
      );
    });
  });

  describe('WCAG contrast', () => {
    it('passes when all pairs pass AA', () => {
      const v = checkColors(
        makeData({
          contrastPairs: [
            {
              textColor: 'rgb(0,0,0)',
              bgColor: 'rgb(255,255,255)',
              textHex: '#000000',
              bgHex: '#ffffff',
              contrast: 21,
              tag: 'p',
              fontSize: 16,
              isBold: false,
              passesAA: true,
              passesAAA: true,
            },
          ],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'contrast-ok', severity: 'pass' })
      );
    });

    it('errors with 6+ failing pairs', () => {
      const pairs = Array.from({ length: 7 }, (_, i) => ({
        textColor: `rgb(${200 + i},${200 + i},${200 + i})`,
        bgColor: 'rgb(255,255,255)',
        textHex: `#c${i}c${i}c${i}`,
        bgHex: '#ffffff',
        contrast: 1.5,
        tag: 'p',
        fontSize: 16,
        isBold: false,
        passesAA: false,
        passesAAA: false,
      }));
      const v = checkColors(makeData({ contrastPairs: pairs }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'contrast-fail', severity: 'error' })
      );
    });
  });

  describe('CSS variable coverage', () => {
    it('warns when coverage < 20%', () => {
      const v = checkColors(makeData({ cssVarCoverage: 10 }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'css-vars-low', severity: 'warn' })
      );
    });

    it('passes when coverage >= 20%', () => {
      const v = checkColors(makeData({ cssVarCoverage: 50 }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'css-vars-ok', severity: 'pass' })
      );
    });
  });

  describe('color balance', () => {
    it('passes with 60/30/10 balance', () => {
      const primary = makeEntry(26, 115, 232, 60);
      const secondary = makeEntry(100, 100, 100, 30);
      const accent = makeEntry(255, 0, 0, 10);
      const v = checkColors(
        makeData({
          brandColors: [
            makeCluster([primary]),
            makeCluster([secondary]),
            makeCluster([accent]),
          ],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'color-balance-ok',
          severity: 'pass',
        })
      );
    });

    it('warns with unbalanced distribution', () => {
      // p=80%, s=15%, a=5% → p>70 triggers warn
      const primary = makeEntry(26, 115, 232, 80);
      const secondary = makeEntry(100, 100, 100, 15);
      const accent = makeEntry(255, 0, 0, 5);
      const v = checkColors(
        makeData({
          brandColors: [
            makeCluster([primary]),
            makeCluster([secondary]),
            makeCluster([accent]),
          ],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'color-balance', severity: 'warn' })
      );
    });
  });
});
