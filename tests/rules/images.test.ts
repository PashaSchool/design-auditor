import { describe, it, expect } from 'vitest';
import { checkImages } from '@rules/images.rules.js';
import type { ImagesData, ImageEntry } from '@extractors/images.js';

function makeImage(overrides: Partial<ImageEntry> = {}): ImageEntry {
  return {
    src: 'image.jpg',
    width: 800,
    height: 450,
    ratio: 800 / 450,
    ratioLabel: '16:9',
    alt: 'Description',
    hasAlt: true,
    context: 'article',
    ...overrides,
  };
}

function makeData(overrides: Partial<ImagesData> = {}): ImagesData {
  return {
    images: [makeImage()],
    uniqueRatios: ['16:9'],
    missingAlt: [],
    inconsistentCards: [],
    ...overrides,
  };
}

describe('checkImages', () => {
  it('passes when no images', () => {
    const v = checkImages(makeData({ images: [] }));
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'images-none', severity: 'pass' })
    );
  });

  describe('alt text', () => {
    it('passes when all images have alt', () => {
      const v = checkImages(makeData());
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'images-alt-ok', severity: 'pass' })
      );
    });

    it('warns with few missing alt', () => {
      const images = Array.from({ length: 10 }, () => makeImage());
      const missing = [makeImage({ hasAlt: false, alt: '' })];
      const v = checkImages(
        makeData({ images: [...images, ...missing], missingAlt: missing })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'images-some-missing-alt',
          severity: 'warn',
        })
      );
    });

    it('errors when >30% missing alt', () => {
      const good = [makeImage()];
      const bad = [
        makeImage({ hasAlt: false, alt: '' }),
        makeImage({ hasAlt: false, alt: '' }),
      ];
      const v = checkImages(
        makeData({ images: [...good, ...bad], missingAlt: bad })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'images-missing-alt',
          severity: 'error',
        })
      );
    });
  });

  describe('aspect ratios', () => {
    it('passes with <= 4 ratios', () => {
      const v = checkImages(makeData({ uniqueRatios: ['16:9', '4:3', '1:1'] }));
      expect(v).toContainEqual(
        expect.objectContaining({ id: 'images-ratios-ok', severity: 'pass' })
      );
    });

    it('warns with 5+ ratios', () => {
      const v = checkImages(
        makeData({
          uniqueRatios: ['16:9', '4:3', '1:1', '3:2', '21:9'],
        })
      );
      expect(v).toContainEqual(
        expect.objectContaining({
          id: 'images-many-ratios',
          severity: 'warn',
        })
      );
    });
  });
});
