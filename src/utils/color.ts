// ─── Types ────────────────────────────────────────────────────────────────────

export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}
export interface Lab {
  L: number;
  a: number;
  b: number;
}

export interface ColorEntry {
  raw: string; // "rgb(26, 115, 232)"
  rgb: RGB;
  lab: Lab;
  count: number; // how many times it appears
  properties: string[]; // ['color', 'background-color', ...]
  tags: string[]; // ['button', 'a', 'h1', ...]
}

export interface ColorCluster {
  representative: ColorEntry; // most frequent color in the cluster
  members: ColorEntry[]; // all similar colors
  totalCount: number;
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

// Browser always returns rgb() or rgba() from getComputedStyle
export function parseRGB(css: string): RGB | null {
  const m = css.match(
    /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/
  );
  if (!m) return null;
  return {
    r: parseInt(m[1]),
    g: parseInt(m[2]),
    b: parseInt(m[3]),
    a: m[4] !== undefined ? parseFloat(m[4]) : 1,
  };
}

// Normalize rgb() string for comparison
// rgba(255,255,255,1) and rgb(255,255,255) → same key
export function normalizeColor(css: string): string {
  const rgb = parseRGB(css);
  if (!rgb) return css;
  // alpha=1 treated as fully opaque → omit alpha channel
  return rgb.a < 1
    ? `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`
    : `rgb(${rgb.r},${rgb.g},${rgb.b})`;
}

// Convert to HEX for easy display
export function rgbToHex(rgb: RGB): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
}

// ─── WCAG Contrast ────────────────────────────────────────────────────────────

// Linearize sRGB → linear RGB
function linearize(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

// Relative luminance (WCAG formula)
export function getLuminance(rgb: RGB): number {
  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Contrast ratio between two colors
export function getContrast(c1: RGB, c2: RGB): number {
  const l1 = getLuminance(c1);
  const l2 = getLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Delta-E (CIE76) ──────────────────────────────────────────────────────────
// Perceptual distance between colors in Lab space
// < 1.0 → invisible difference
// < 2.0 → nearly identical → merge candidates
// > 3.0 → noticeably different

function rgbToXYZ(rgb: RGB): [number, number, number] {
  const r = linearize(rgb.r);
  const g = linearize(rgb.g);
  const b = linearize(rgb.b);
  return [
    r * 0.4124 + g * 0.3576 + b * 0.1805,
    r * 0.2126 + g * 0.7152 + b * 0.0722,
    r * 0.0193 + g * 0.1192 + b * 0.9505,
  ];
}

function xyzToLab(xyz: [number, number, number]): Lab {
  // D65 reference white
  const [X, Y, Z] = [xyz[0] / 0.95047, xyz[1] / 1.0, xyz[2] / 1.08883];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return {
    L: 116 * f(Y) - 16,
    a: 500 * (f(X) - f(Y)),
    b: 200 * (f(Y) - f(Z)),
  };
}

export function rgbToLab(rgb: RGB): Lab {
  return xyzToLab(rgbToXYZ(rgb));
}

export function deltaE(lab1: Lab, lab2: Lab): number {
  return Math.sqrt(
    Math.pow(lab2.L - lab1.L, 2) +
      Math.pow(lab2.a - lab1.a, 2) +
      Math.pow(lab2.b - lab1.b, 2)
  );
}

// ─── Clustering ───────────────────────────────────────────────────────────────

// Greedy clustering: group colors within delta-E threshold
export function clusterColors(
  colors: ColorEntry[],
  threshold = 8
): ColorCluster[] {
  // sort — most popular first
  const sorted = [...colors].sort((a, b) => b.count - a.count);
  const clusters: ColorCluster[] = [];

  for (const color of sorted) {
    const existing = clusters.find(
      (c) => deltaE(c.representative.lab, color.lab) <= threshold
    );
    if (existing) {
      existing.members.push(color);
      existing.totalCount += color.count;
    } else {
      clusters.push({
        representative: color,
        members: [],
        totalCount: color.count,
      });
    }
  }

  return clusters.sort((a, b) => b.totalCount - a.totalCount);
}

// ─── Color classification ─────────────────────────────────────────────────────

// Checks if a color is "neutral" (near-white, black, or grey)
export function isNeutral(rgb: RGB, threshold = 20): boolean {
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  const saturation = max - min;
  return saturation < threshold;
}

// Checks if a color is transparent / nearly invisible
export function isTransparent(rgb: RGB): boolean {
  return rgb.a < 0.1;
}

// Checks if a color is very light (background)
export function isNearWhite(rgb: RGB): boolean {
  return rgb.r > 240 && rgb.g > 240 && rgb.b > 240;
}

// Checks if a color is very dark
export function isNearBlack(rgb: RGB): boolean {
  return rgb.r < 20 && rgb.g < 20 && rgb.b < 20;
}
