import { describe, it, expect } from 'vitest';
import { checkComponents } from '@rules/components.rules.js';
import type { ComponentsData, ButtonData } from '@extractors/components.js';

function makeButton(overrides: Partial<ButtonData> = {}): ButtonData {
  return {
    tag: 'button',
    text: 'Click me',
    width: 120,
    height: 48,
    paddingTop: 12,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    borderRadius: '8px',
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: 'rgb(26,115,232)',
    color: 'rgb(255,255,255)',
    cursor: 'pointer',
    hasHoverStyle: true,
    hasFocusStyle: true,
    hasDisabledStyle: false,
    ...overrides,
  };
}

function makeData(overrides: Partial<ComponentsData> = {}): ComponentsData {
  return {
    buttons: [makeButton()],
    uniqueRadii: ['8px'],
    radiiByElement: {},
    shadows: [],
    zIndices: [],
    ...overrides,
  };
}

describe('checkComponents', () => {
  describe('touch targets', () => {
    it('passes when all buttons >= 44px', () => {
      const v = checkComponents(makeData());
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'touch-targets-ok', severity: 'pass' })
      );
    });

    it('warns when some buttons < 44px', () => {
      const v = checkComponents(
        makeData({
          buttons: [
            makeButton({ height: 48 }),
            makeButton({ height: 48 }),
            makeButton({ height: 48 }),
            makeButton({ height: 32, text: 'Small' }),
          ],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'touch-targets', severity: 'warn' })
      );
    });

    it('errors when >30% buttons too small', () => {
      const v = checkComponents(
        makeData({
          buttons: [
            makeButton({ height: 32 }),
            makeButton({ height: 30 }),
            makeButton({ height: 48 }),
          ],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'touch-targets', severity: 'error' })
      );
    });
  });

  describe('interactive states', () => {
    it('passes with hover and focus', () => {
      const v = checkComponents(makeData());
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'interactive-states-ok',
          severity: 'pass',
        })
      );
    });

    it('errors when focus missing', () => {
      const v = checkComponents(
        makeData({
          buttons: [makeButton({ hasFocusStyle: false })],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'no-focus-styles', severity: 'error' })
      );
    });
  });

  describe('border-radius', () => {
    it('passes with <= 4 radii', () => {
      const v = checkComponents(
        makeData({ uniqueRadii: ['4px', '8px', '12px'] })
      );
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'radii-ok', severity: 'pass' })
      );
    });

    it('errors with 7+ radii', () => {
      const radii = ['2px', '4px', '6px', '8px', '10px', '12px', '16px'];
      const v = checkComponents(makeData({ uniqueRadii: radii }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'too-many-radii', severity: 'error' })
      );
    });

    it('ignores 50% circles', () => {
      const radii = ['4px', '8px', '50%'];
      const v = checkComponents(makeData({ uniqueRadii: radii }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'radii-ok', severity: 'pass' })
      );
    });
  });

  describe('shadows', () => {
    it('passes with no shadows', () => {
      const v = checkComponents(makeData({ shadows: [] }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'no-shadows', severity: 'pass' })
      );
    });

    it('errors with 9+ shadows', () => {
      const shadows = Array.from({ length: 9 }, (_, i) => ({
        value: `0 ${i + 1}px ${i * 2}px rgba(0,0,0,0.1)`,
        offsetY: i + 1,
        blur: i * 2,
        spread: 0,
        count: 5,
        tags: ['div'],
      }));
      const v = checkComponents(makeData({ shadows }));
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'too-many-shadows',
          severity: 'error',
        })
      );
    });
  });

  describe('z-index', () => {
    it('passes with few organized values', () => {
      const v = checkComponents(makeData({ zIndices: [100, 200, 300] }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'zindex-ok', severity: 'pass' })
      );
    });

    it('warns about magic numbers', () => {
      const v = checkComponents(makeData({ zIndices: [1, 100, 9001] }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'zindex-magic', severity: 'warn' })
      );
    });

    it('warns with 11+ z-index values', () => {
      const zIndices = Array.from({ length: 12 }, (_, i) => i * 100);
      const v = checkComponents(makeData({ zIndices }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'too-many-zindex', severity: 'warn' })
      );
    });
  });
});
