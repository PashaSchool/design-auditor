import { Page } from 'playwright';

export interface SpacingValue {
  value: number; // pixels
  property: string; // margin-top, padding-bottom etc.
  tag: string; // which element
  isOutlier?: boolean; // will be populated in rules
}

export interface RhythmData {
  // base unit — derived from body
  bodyFontSize: number;
  bodyLineHeight: number;
  rhythmUnit: number; // bodyFontSize × bodyLineHeight

  // all collected values
  lineHeights: SpacingValue[];
  margins: SpacingValue[];
  paddings: SpacingValue[];

  // convenient unique lists for rules
  uniqueLineHeights: number[];
  uniqueMargins: number[];
  uniquePaddings: number[];
}

const TEXT_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'span',
  'a',
  'label',
  'td',
  'th',
];
const SKIP_TAGS = [
  'script',
  'style',
  'meta',
  'head',
  'link',
  'br',
  'hr',
  'img',
  'svg',
  'path',
];

export async function extractRhythm(page: Page): Promise<RhythmData> {
  const raw = await page.evaluate(
    ({ textTags, skipTags }) => {
      // --- body base values ---
      const bodyStyle = window.getComputedStyle(document.body);
      const bodyFontSize = parseFloat(bodyStyle.fontSize) || 16;
      const rawLineHeight = bodyStyle.lineHeight;
      const bodyLineHeightPx =
        rawLineHeight === 'normal'
          ? bodyFontSize * 1.5
          : parseFloat(rawLineHeight);
      const bodyLineHeight = bodyLineHeightPx / bodyFontSize; // as ratio

      // --- collect all elements ---
      const elements = Array.from(document.querySelectorAll('*'));

      const lineHeights: Array<{
        value: number;
        property: string;
        tag: string;
      }> = [];
      const margins: Array<{ value: number; property: string; tag: string }> =
        [];
      const paddings: Array<{ value: number; property: string; tag: string }> =
        [];

      elements.forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (skipTags.includes(tag)) return;

        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);

        // line-height — text tags only
        if (textTags.includes(tag) && fontSize > 0) {
          const lhRaw = style.lineHeight;
          const lhPx = lhRaw === 'normal' ? fontSize * 1.5 : parseFloat(lhRaw);
          if (!isNaN(lhPx) && lhPx > 0) {
            lineHeights.push({
              value: Math.round(lhPx),
              property: 'line-height',
              tag,
            });
          }
        }

        // margin top/bottom
        const mt = parseFloat(style.marginTop);
        const mb = parseFloat(style.marginBottom);
        if (!isNaN(mt) && mt > 0)
          margins.push({ value: Math.round(mt), property: 'margin-top', tag });
        if (!isNaN(mb) && mb > 0)
          margins.push({
            value: Math.round(mb),
            property: 'margin-bottom',
            tag,
          });

        // padding top/bottom
        const pt = parseFloat(style.paddingTop);
        const pb = parseFloat(style.paddingBottom);
        if (!isNaN(pt) && pt > 0)
          paddings.push({
            value: Math.round(pt),
            property: 'padding-top',
            tag,
          });
        if (!isNaN(pb) && pb > 0)
          paddings.push({
            value: Math.round(pb),
            property: 'padding-bottom',
            tag,
          });
      });

      return { bodyFontSize, bodyLineHeight, lineHeights, margins, paddings };
    },
    { textTags: TEXT_TAGS, skipTags: SKIP_TAGS }
  );

  const rhythmUnit = Math.round(raw.bodyFontSize * raw.bodyLineHeight);

  // unique sorted values
  const uniqueLineHeights = [
    ...new Set(raw.lineHeights.map((v) => v.value)),
  ].sort((a, b) => a - b);
  const uniqueMargins = [...new Set(raw.margins.map((v) => v.value))].sort(
    (a, b) => a - b
  );
  const uniquePaddings = [...new Set(raw.paddings.map((v) => v.value))].sort(
    (a, b) => a - b
  );

  return {
    bodyFontSize: raw.bodyFontSize,
    bodyLineHeight: raw.bodyLineHeight,
    rhythmUnit,
    lineHeights: raw.lineHeights,
    margins: raw.margins,
    paddings: raw.paddings,
    uniqueLineHeights,
    uniqueMargins,
    uniquePaddings,
  };
}
