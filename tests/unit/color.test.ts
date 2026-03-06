import { describe, it, expect } from 'vitest';
import {
  parseRGB,
  normalizeColor,
  rgbToHex,
  getLuminance,
  getContrast,
  rgbToLab,
  deltaE,
  clusterColors,
  isNeutral,
  isTransparent,
  isNearWhite,
  isNearBlack,
  type RGB,
  type ColorEntry,
} from '@utils/color.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeColorEntry(
  r: number,
  g: number,
  b: number,
  count = 1
): ColorEntry {
  const rgb: RGB = { r, g, b, a: 1 };
  const lab = rgbToLab(rgb);
  return {
    raw: `rgb(${r}, ${g}, ${b})`,
    rgb,
    lab,
    count,
    properties: ['color'],
    tags: ['div'],
  };
}

// ─── parseRGB ────────────────────────────────────────────────────────────────

describe('parseRGB', () => {
  it('parses rgb()', () => {
    expect(parseRGB('rgb(26, 115, 232)')).toEqual({
      r: 26,
      g: 115,
      b: 232,
      a: 1,
    });
  });

  it('parses rgba()', () => {
    expect(parseRGB('rgba(255, 0, 0, 0.5)')).toEqual({
      r: 255,
      g: 0,
      b: 0,
      a: 0.5,
    });
  });

  it('parses without spaces', () => {
    expect(parseRGB('rgb(0,0,0)')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it('returns null for invalid input', () => {
    expect(parseRGB('invalid')).toBeNull();
    expect(parseRGB('#ff0000')).toBeNull();
    expect(parseRGB('')).toBeNull();
  });
});

// ─── normalizeColor ──────────────────────────────────────────────────────────

describe('normalizeColor', () => {
  it('normalizes opaque rgba to rgb', () => {
    expect(normalizeColor('rgba(255, 255, 255, 1)')).toBe(
      'rgb(255,255,255)'
    );
  });

  it('keeps semi-transparent as rgba', () => {
    expect(normalizeColor('rgba(0, 0, 0, 0.5)')).toBe('rgba(0,0,0,0.5)');
  });

  it('returns original for invalid input', () => {
    expect(normalizeColor('invalid')).toBe('invalid');
  });
});

// ─── rgbToHex ────────────────────────────────────────────────────────────────

describe('rgbToHex', () => {
  it('converts black', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0, a: 1 })).toBe('#000000');
  });

  it('converts white', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255, a: 1 })).toBe('#ffffff');
  });

  it('converts arbitrary color', () => {
    expect(rgbToHex({ r: 26, g: 115, b: 232, a: 1 })).toBe('#1a73e8');
  });

  it('pads single-digit hex values', () => {
    expect(rgbToHex({ r: 1, g: 2, b: 3, a: 1 })).toBe('#010203');
  });
});

// ─── getLuminance ────────────────────────────────────────────────────────────

describe('getLuminance', () => {
  it('returns 0 for black', () => {
    expect(getLuminance({ r: 0, g: 0, b: 0, a: 1 })).toBeCloseTo(0, 4);
  });

  it('returns 1 for white', () => {
    expect(getLuminance({ r: 255, g: 255, b: 255, a: 1 })).toBeCloseTo(1, 4);
  });

  it('returns ~0.2 for mid-gray', () => {
    const lum = getLuminance({ r: 128, g: 128, b: 128, a: 1 });
    expect(lum).toBeGreaterThan(0.15);
    expect(lum).toBeLessThan(0.25);
  });
});

// ─── getContrast ─────────────────────────────────────────────────────────────

describe('getContrast', () => {
  const black: RGB = { r: 0, g: 0, b: 0, a: 1 };
  const white: RGB = { r: 255, g: 255, b: 255, a: 1 };

  it('returns 21:1 for black on white', () => {
    expect(getContrast(black, white)).toBeCloseTo(21, 0);
  });

  it('returns 1:1 for same color', () => {
    expect(getContrast(white, white)).toBeCloseTo(1, 2);
  });

  it('is symmetric', () => {
    const blue: RGB = { r: 0, g: 0, b: 255, a: 1 };
    expect(getContrast(blue, white)).toBeCloseTo(getContrast(white, blue), 4);
  });
});

// ─── rgbToLab & deltaE ──────────────────────────────────────────────────────

describe('deltaE', () => {
  it('returns 0 for identical colors', () => {
    const lab = rgbToLab({ r: 100, g: 100, b: 100, a: 1 });
    expect(deltaE(lab, lab)).toBe(0);
  });

  it('returns small value for similar colors', () => {
    const lab1 = rgbToLab({ r: 100, g: 100, b: 100, a: 1 });
    const lab2 = rgbToLab({ r: 105, g: 100, b: 100, a: 1 });
    expect(deltaE(lab1, lab2)).toBeLessThan(3);
  });

  it('returns large value for very different colors', () => {
    const lab1 = rgbToLab({ r: 255, g: 0, b: 0, a: 1 });
    const lab2 = rgbToLab({ r: 0, g: 0, b: 255, a: 1 });
    expect(deltaE(lab1, lab2)).toBeGreaterThan(50);
  });
});

// ─── clusterColors ───────────────────────────────────────────────────────────

describe('clusterColors', () => {
  it('returns empty array for no colors', () => {
    expect(clusterColors([])).toEqual([]);
  });

  it('groups similar colors into one cluster', () => {
    const c1 = makeColorEntry(100, 100, 100, 10);
    const c2 = makeColorEntry(102, 100, 100, 5);
    const clusters = clusterColors([c1, c2], 8);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].totalCount).toBe(15);
  });

  it('keeps different colors in separate clusters', () => {
    const red = makeColorEntry(255, 0, 0, 10);
    const blue = makeColorEntry(0, 0, 255, 10);
    const clusters = clusterColors([red, blue], 8);
    expect(clusters).toHaveLength(2);
  });

  it('sorts clusters by total count descending', () => {
    const c1 = makeColorEntry(255, 0, 0, 1);
    const c2 = makeColorEntry(0, 0, 255, 100);
    const clusters = clusterColors([c1, c2], 8);
    expect(clusters[0].representative.rgb.b).toBe(255); // blue first
  });
});

// ─── Classification ──────────────────────────────────────────────────────────

describe('isNeutral', () => {
  it('gray is neutral', () => {
    expect(isNeutral({ r: 128, g: 128, b: 128, a: 1 })).toBe(true);
  });

  it('pure blue is not neutral', () => {
    expect(isNeutral({ r: 0, g: 0, b: 255, a: 1 })).toBe(false);
  });

  it('white is neutral', () => {
    expect(isNeutral({ r: 255, g: 255, b: 255, a: 1 })).toBe(true);
  });
});

describe('isTransparent', () => {
  it('a=0 is transparent', () => {
    expect(isTransparent({ r: 0, g: 0, b: 0, a: 0 })).toBe(true);
  });

  it('a=0.05 is transparent', () => {
    expect(isTransparent({ r: 0, g: 0, b: 0, a: 0.05 })).toBe(true);
  });

  it('a=0.5 is not transparent', () => {
    expect(isTransparent({ r: 0, g: 0, b: 0, a: 0.5 })).toBe(false);
  });
});

describe('isNearWhite', () => {
  it('rgb(255,255,255) is near white', () => {
    expect(isNearWhite({ r: 255, g: 255, b: 255, a: 1 })).toBe(true);
  });

  it('rgb(245,245,245) is near white', () => {
    expect(isNearWhite({ r: 245, g: 245, b: 245, a: 1 })).toBe(true);
  });

  it('rgb(200,200,200) is not near white', () => {
    expect(isNearWhite({ r: 200, g: 200, b: 200, a: 1 })).toBe(false);
  });
});

describe('isNearBlack', () => {
  it('rgb(0,0,0) is near black', () => {
    expect(isNearBlack({ r: 0, g: 0, b: 0, a: 1 })).toBe(true);
  });

  it('rgb(10,10,10) is near black', () => {
    expect(isNearBlack({ r: 10, g: 10, b: 10, a: 1 })).toBe(true);
  });

  it('rgb(50,50,50) is not near black', () => {
    expect(isNearBlack({ r: 50, g: 50, b: 50, a: 1 })).toBe(false);
  });
});
