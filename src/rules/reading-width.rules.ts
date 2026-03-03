import { ReadingWidthData } from '@extractors/reading-width.js';
import { Violation } from '@/types.js';

export function checkReadingWidth(data: ReadingWidthData): Violation[] {
  const violations: Violation[] = [];
  const { blocks, avgCharCount, tooWide, tooNarrow, optimal } = data;

  if (blocks.length === 0) {
    violations.push({
      id: 'reading-width-no-blocks',
      severity: 'pass',
      message: 'Reading width: no text blocks found',
    });
    return violations;
  }

  const optimalPct = Math.round((optimal.length / blocks.length) * 100);

  // ─── Average line width ───────────────────────────────────────────────────────
  if (avgCharCount > 85) {
    violations.push({
      id: 'reading-width-too-wide',
      severity: 'error',
      message: `Average line width: ~${avgCharCount} chars — rec. 45–75`,
      hint: 'Lines too wide are hard to read — eyes struggle to find the next line start',
    });
  } else if (avgCharCount > 75) {
    violations.push({
      id: 'reading-width-wide',
      severity: 'warn',
      message: `Average line width: ~${avgCharCount} chars — slightly over rec. (45–75)`,
    });
  } else if (avgCharCount < 30) {
    violations.push({
      id: 'reading-width-too-narrow',
      severity: 'warn',
      message: `Average line width: ~${avgCharCount} chars — rec. 45–75`,
      hint: 'Lines too narrow cause constant eye movement to the next line',
    });
  } else {
    violations.push({
      id: 'reading-width-ok',
      severity: 'pass',
      message: `Average line width: ~${avgCharCount} chars — within optimal range (45–75)`,
    });
  }

  // ─── Share of blocks within optimal range ────────────────────────────────────
  if (optimalPct < 40 && blocks.length >= 3) {
    violations.push({
      id: 'reading-width-consistency',
      severity: 'warn',
      message: `Only ${optimalPct}% of text blocks have optimal line width`,
      hint:
        tooWide.length > 0
          ? `Too-wide blocks: ${tooWide.length} (e.g. "${tooWide[0].text.slice(0, 40)}...")`
          : undefined,
    });
  } else if (optimalPct >= 60) {
    violations.push({
      id: 'reading-width-consistency-ok',
      severity: 'pass',
      message: `${optimalPct}% of text blocks within optimal width — OK`,
    });
  }

  return violations;
}
