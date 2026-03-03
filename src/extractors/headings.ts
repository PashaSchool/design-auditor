import { Page } from 'playwright';

export interface HeadingEntry {
  level: number; // 1–6
  tag: string; // h1, h2, ...
  text: string; // first 60 characters
  fontSize: number; // computed px
  fontWeight: string;
  domIndex: number; // order in DOM
}

export interface HeadingsData {
  headings: HeadingEntry[];
  h1Count: number;
  skippedLevels: Array<{ from: number; to: number; text: string }>; // h1 → h3
  sizeInversions: Array<{ a: HeadingEntry; b: HeadingEntry }>; // h2 larger than h1
  levelSizes: Record<number, number[]>; // { 1: [48], 2: [32,32], 3: [24,24,20] }
  hasLogicalOrder: boolean;
}

export async function extractHeadings(page: Page): Promise<HeadingsData> {
  const raw = await page.evaluate(() => {
    const selector = 'h1, h2, h3, h4, h5, h6';
    const els = Array.from(document.querySelectorAll(selector));

    return els.map((el, index) => {
      const style = window.getComputedStyle(el);
      const level = parseInt(el.tagName[1]);
      const text = (el.textContent || '').trim().slice(0, 60);
      const fontSize = parseFloat(style.fontSize);

      return {
        level,
        tag: el.tagName.toLowerCase(),
        text,
        fontSize,
        fontWeight: style.fontWeight,
        domIndex: index,
      };
    });
  });

  const headings = raw as HeadingEntry[];

  // ─── H1 count ────────────────────────────────────────────────────────────────
  const h1Count = headings.filter((h) => h.level === 1).length;

  // ─── Skipped levels (h1 → h3 without h2) ────────────────────────────────────
  const skippedLevels: HeadingsData['skippedLevels'] = [];
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    // level increased by more than 1 → skip
    if (curr.level > prev.level + 1) {
      skippedLevels.push({ from: prev.level, to: curr.level, text: curr.text });
    }
  }

  // ─── Size inversions: h2 larger or equal to h1 ───────────────────────────────
  const levelSizes: Record<number, number[]> = {};
  for (const h of headings) {
    if (!levelSizes[h.level]) levelSizes[h.level] = [];
    levelSizes[h.level].push(h.fontSize);
  }

  const avgSize = (level: number) => {
    const sizes = levelSizes[level];
    if (!sizes?.length) return 0;
    return sizes.reduce((a, b) => a + b, 0) / sizes.length;
  };

  const sizeInversions: HeadingsData['sizeInversions'] = [];
  const levels = Object.keys(levelSizes).map(Number).sort();
  for (let i = 1; i < levels.length; i++) {
    const higher = levels[i - 1]; // e.g. 1
    const lower = levels[i]; // e.g. 2
    if (avgSize(higher) <= avgSize(lower)) {
      // take first element of each level for context
      const a = headings.find((h) => h.level === higher)!;
      const b = headings.find((h) => h.level === lower)!;
      if (a && b) sizeInversions.push({ a, b });
    }
  }

  // ─── Logical order: h1 should come first ─────────────────────────────────────
  const firstH1Index = headings.findIndex((h) => h.level === 1);
  const hasLogicalOrder = firstH1Index === 0 || firstH1Index === -1;

  return {
    headings,
    h1Count,
    skippedLevels,
    sizeInversions,
    levelSizes,
    hasLogicalOrder,
  };
}
