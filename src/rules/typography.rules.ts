import { TypographyData } from '@extractors/typography.js'
import { Violation } from '@/types.js'

// Checks if an array of numbers roughly follows a modular scale
// (each next element is approximately ratio times larger)
function isModularScale(sizes: string[]): boolean {
  const nums = sizes
    .map(s => parseFloat(s))
    .filter(n => !isNaN(n) && n > 0)
    .sort((a, b) => a - b)

  if (nums.length < 3) return true

  const ratios = []
  for (let i = 1; i < nums.length; i++) {
    ratios.push(nums[i] / nums[i - 1])
  }

  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length
  // considered a scale if all ratios are within 15% of the average
  return ratios.every(r => Math.abs(r - avgRatio) / avgRatio < 0.15)
}

// Filter system/fallback fonts — they don't count as "extra"
const SYSTEM_FONTS = [
  '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'system-ui',
  'sans-serif', 'serif', 'monospace', 'ui-monospace', 'ui-sans-serif',
  'ui-serif', 'arial', 'helvetica', 'times new roman', 'georgia'
]

function isSystemFont(family: string): boolean {
  return SYSTEM_FONTS.includes(family.toLowerCase())
}

export function checkTypography(data: TypographyData): Violation[] {
  const violations: Violation[] = []
  const customFonts = data.fonts.filter(f => !isSystemFont(f.family))

  // 1. Font family count
  if (customFonts.length > 3) {
    violations.push({
      id: 'too-many-font-families',
      severity: 'error',
      message: `${customFonts.length} custom fonts found — recommendation: max 3`,
      hint: `Fonts: ${customFonts.map(f => `"${f.family}"`).join(', ')}`
    })
  } else if (customFonts.length === 3) {
    violations.push({
      id: 'many-font-families',
      severity: 'warn',
      message: `${customFonts.length} custom fonts — at the recommendation limit (max 3)`,
      hint: `Fonts: ${customFonts.map(f => `"${f.family}"`).join(', ')}`
    })
  } else {
    violations.push({
      id: 'font-families-ok',
      severity: 'pass',
      message: `Font families: ${customFonts.length} — OK`
    })
  }

  // 2. Unique font sizes count
  const sizeCount = data.allSizes.length
  if (sizeCount > 10) {
    violations.push({
      id: 'too-many-font-sizes',
      severity: 'error',
      message: `${sizeCount} unique font sizes — recommendation: max 8–10`,
      hint: `Sizes: ${data.allSizes.join(', ')}`
    })
  } else if (sizeCount > 7) {
    violations.push({
      id: 'many-font-sizes',
      severity: 'warn',
      message: `${sizeCount} unique font sizes — rec. 6–8`,
      hint: `Sizes: ${data.allSizes.join(', ')}`
    })
  } else {
    violations.push({
      id: 'font-sizes-ok',
      severity: 'pass',
      message: `Font sizes: ${sizeCount} — OK`
    })
  }

  // 3. Modular scale
  if (!isModularScale(data.allSizes)) {
    violations.push({
      id: 'no-modular-scale',
      severity: 'warn',
      message: 'Font sizes do not follow a modular scale',
      hint: 'Try Major Third (1.25) or Perfect Fourth (1.333): 12 → 15 → 19 → 24 → 30...'
    })
  }

  // 4. Unique line-height count
  const lhCount = data.allLineHeights.filter(lh => lh !== 'normal').length
  if (lhCount > 8) {
    violations.push({
      id: 'too-many-line-heights',
      severity: 'error',
      message: `${lhCount} unique line-heights — recommendation: max 4–6`,
      hint: 'Too many different line spacings — no vertical rhythm system'
    })
  } else if (lhCount > 5) {
    violations.push({
      id: 'many-line-heights',
      severity: 'warn',
      message: `${lhCount} unique line-heights — rec. 4–5`,
    })
  } else {
    violations.push({
      id: 'line-heights-ok',
      severity: 'pass',
      message: `Line-heights: ${lhCount} — OK`
    })
  }

  return violations
}
