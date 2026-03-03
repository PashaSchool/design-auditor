import { HeadingsData } from '@extractors/headings.js';
import { Violation } from '@/types.js';

export function checkHeadings(data: HeadingsData): Violation[] {
  const violations: Violation[] = [];
  const {
    headings,
    h1Count,
    skippedLevels,
    sizeInversions,
    levelSizes,
    hasLogicalOrder,
  } = data;

  if (headings.length === 0) {
    violations.push({
      id: 'headings-none',
      severity: 'warn',
      message: 'No headings (h1–h6) found on the page',
      hint: 'Headings are important for structure, SEO and screen readers',
    });
    return violations;
  }

  // ─── 1. H1 count ────────────────────────────────────────────────────────────
  if (h1Count === 0) {
    violations.push({
      id: 'no-h1',
      severity: 'error',
      message: 'H1 missing — every page must have exactly one H1',
      hint: 'H1 is the main page heading (SEO + accessibility)',
    });
  } else if (h1Count > 1) {
    const h1s = headings.filter((h) => h.level === 1);
    violations.push({
      id: 'multiple-h1',
      severity: 'error',
      message: `Found ${h1Count} H1 tags — there should be exactly one`,
      hint: h1s.map((h) => `"${h.text}"`).join(', '),
    });
  } else {
    violations.push({
      id: 'h1-ok',
      severity: 'pass',
      message: `H1: one on the page — "${headings.find((h) => h.level === 1)?.text}"`,
    });
  }

  // ─── 2. Logical order (H1 first) ────────────────────────────────────────────
  if (!hasLogicalOrder && h1Count > 0) {
    const firstH1 = headings.find((h) => h.level === 1);
    violations.push({
      id: 'h1-not-first',
      severity: 'warn',
      message: 'H1 is not the first heading on the page',
      hint: `H1 "${firstH1?.text}" appears after other headings`,
    });
  }

  // ─── 3. Skipped levels ──────────────────────────────────────────────────────
  if (skippedLevels.length > 0) {
    const examples = skippedLevels
      .slice(0, 3)
      .map((s) => `H${s.from} → H${s.to} ("${s.text.slice(0, 30)}")`)
      .join(', ');
    violations.push({
      id: 'skipped-heading-levels',
      severity: 'error',
      message: `${skippedLevels.length} skipped level(s) in heading hierarchy`,
      hint: examples,
    });
  } else {
    violations.push({
      id: 'heading-hierarchy-ok',
      severity: 'pass',
      message: 'Heading hierarchy has no skipped levels',
    });
  }

  // ─── 4. Visual size hierarchy ────────────────────────────────────────────────
  if (sizeInversions.length > 0) {
    const examples = sizeInversions
      .slice(0, 2)
      .map(({ a, b }) => {
        const avgA =
          levelSizes[a.level].reduce((s, v) => s + v, 0) /
          levelSizes[a.level].length;
        const avgB =
          levelSizes[b.level].reduce((s, v) => s + v, 0) /
          levelSizes[b.level].length;
        return `H${a.level} (${Math.round(avgA)}px) ≤ H${b.level} (${Math.round(avgB)}px)`;
      })
      .join(', ');
    violations.push({
      id: 'heading-size-inversion',
      severity: 'error',
      message: 'Heading sizes break visual hierarchy',
      hint: examples,
    });
  } else {
    const sizes = Object.entries(levelSizes)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, s]) => {
        const avg = Math.round(s.reduce((a, b) => a + b, 0) / s.length);
        return `H${level}: ${avg}px`;
      })
      .join(' > ');
    violations.push({
      id: 'heading-sizes-ok',
      severity: 'pass',
      message: 'Visual size hierarchy is correct',
      hint: sizes,
    });
  }

  // ─── 5. Deep heading levels ──────────────────────────────────────────────────
  const deepLevels = headings.filter((h) => h.level >= 5);
  if (deepLevels.length > 3) {
    violations.push({
      id: 'too-deep-headings',
      severity: 'warn',
      message: `${deepLevels.length} H5–H6 headings — H1–H4 is usually sufficient`,
      hint: 'Deep hierarchy may indicate overly complex structure',
    });
  }

  return violations;
}
