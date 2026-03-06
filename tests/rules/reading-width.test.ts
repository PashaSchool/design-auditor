import { describe, it, expect } from 'vitest';
import { checkReadingWidth } from '@rules/reading-width.rules.js';
import type { ReadingWidthData, TextBlock } from '@extractors/reading-width.js';

function makeBlock(charCount: number): TextBlock {
  return {
    tag: 'p',
    widthPx: charCount * 8,
    fontSize: 16,
    charCount,
    text: 'Lorem ipsum dolor sit amet',
  };
}

function makeData(overrides: Partial<ReadingWidthData> = {}): ReadingWidthData {
  const blocks = [makeBlock(60), makeBlock(65)];
  return {
    blocks,
    avgCharCount: 62,
    tooWide: [],
    tooNarrow: [],
    optimal: blocks,
    ...overrides,
  };
}

describe('checkReadingWidth', () => {
  it('passes when no text blocks', () => {
    const v = checkReadingWidth(
      makeData({ blocks: [], avgCharCount: 0, optimal: [] })
    );
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'reading-width-no-blocks',
        severity: 'pass',
      })
    );
  });

  it('passes with optimal average (45-75 chars)', () => {
    const v = checkReadingWidth(makeData());
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'reading-width-ok',
        severity: 'pass',
      })
    );
  });

  it('warns when average 76-85 chars', () => {
    const v = checkReadingWidth(makeData({ avgCharCount: 80 }));
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'reading-width-wide',
        severity: 'warn',
      })
    );
  });

  it('errors when average > 85 chars', () => {
    const v = checkReadingWidth(makeData({ avgCharCount: 95 }));
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'reading-width-too-wide',
        severity: 'error',
      })
    );
  });

  it('warns when average < 30 chars', () => {
    const v = checkReadingWidth(makeData({ avgCharCount: 25 }));
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'reading-width-too-narrow',
        severity: 'warn',
      })
    );
  });

  it('warns when few blocks in optimal range', () => {
    const blocks = Array.from({ length: 5 }, () => makeBlock(90));
    const v = checkReadingWidth(
      makeData({
        blocks,
        avgCharCount: 62,
        optimal: [blocks[0]],
        tooWide: blocks.slice(1),
      })
    );
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'reading-width-consistency',
        severity: 'warn',
      })
    );
  });
});
