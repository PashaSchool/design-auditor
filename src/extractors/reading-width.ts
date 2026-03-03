import { Page } from 'playwright';

export interface TextBlock {
  tag: string;
  widthPx: number; // container width in pixels
  fontSize: number; // font size in pixels
  charCount: number; // approximate characters per line
  text: string; // first 60 chars for context
}

export interface ReadingWidthData {
  blocks: TextBlock[];
  avgCharCount: number; // average across all blocks
  tooWide: TextBlock[]; // > 80 characters
  tooNarrow: TextBlock[]; // < 30 characters
  optimal: TextBlock[]; // 45–75 characters
}

// Average character width to font-size ratio
// For most sans-serif fonts ≈ 0.48–0.52
const CHAR_WIDTH_RATIO = 0.5;

// Text tags where readability matters
const TEXT_TAGS = ['p', 'article', 'section', 'main', 'li', 'blockquote', 'td'];

export async function extractReadingWidth(
  page: Page
): Promise<ReadingWidthData> {
  const blocks = await page.evaluate(
    ({ tags, ratio }) => {
      const results: Array<{
        tag: string;
        widthPx: number;
        fontSize: number;
        charCount: number;
        text: string;
      }> = [];

      tags.forEach((tag) => {
        const elements = Array.from(document.querySelectorAll(tag));

        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          const text = (el.textContent || '').trim();
          const fontSize = parseFloat(style.fontSize);

          // skip invisible or empty elements
          if (rect.width < 100) return;
          if (!text || text.length < 20) return;
          if (fontSize < 12) return;

          // approximate characters per line
          const charCount = Math.round(rect.width / (fontSize * ratio));

          results.push({
            tag,
            widthPx: Math.round(rect.width),
            fontSize: Math.round(fontSize),
            charCount,
            text: text.slice(0, 60),
          });
        });
      });

      return results;
    },
    { tags: TEXT_TAGS, ratio: CHAR_WIDTH_RATIO }
  );

  const tooWide = blocks.filter((b) => b.charCount > 80);
  const tooNarrow = blocks.filter((b) => b.charCount < 30);
  const optimal = blocks.filter((b) => b.charCount >= 45 && b.charCount <= 75);

  const avgCharCount =
    blocks.length > 0
      ? Math.round(blocks.reduce((s, b) => s + b.charCount, 0) / blocks.length)
      : 0;

  return { blocks, avgCharCount, tooWide, tooNarrow, optimal };
}
