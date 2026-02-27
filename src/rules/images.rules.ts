import { ImagesData } from '@extractors/images.js'
import { Violation } from '@/types.js'

export function checkImages(data: ImagesData): Violation[] {
  const violations: Violation[] = []
  const { images, uniqueRatios, missingAlt, inconsistentCards } = data

  if (images.length === 0) {
    violations.push({
      id: 'images-none',
      severity: 'pass',
      message: 'Images: no content images found'
    })
    return violations
  }

  // ─── 1. Alt texts ─────────────────────────────────────────────────────────────
  const missingPct = Math.round(missingAlt.length / images.length * 100)

  if (missingAlt.length > images.length * 0.3) {
    violations.push({
      id: 'images-missing-alt',
      severity: 'error',
      message: `${missingAlt.length}/${images.length} images missing alt text (${missingPct}%)`,
      hint: 'Alt text is required for screen readers and SEO (WCAG 1.1.1)'
    })
  } else if (missingAlt.length > 0) {
    violations.push({
      id: 'images-some-missing-alt',
      severity: 'warn',
      message: `${missingAlt.length} images missing alt text`,
      hint: missingAlt.slice(0, 2).map(i => i.src).join(', ')
    })
  } else {
    violations.push({
      id: 'images-alt-ok',
      severity: 'pass',
      message: `Alt texts: all ${images.length} images have alt — OK`
    })
  }

  // ─── 2. Unique ratio count ────────────────────────────────────────────────────
  const realRatios = uniqueRatios.filter(r => r !== 'free')

  if (uniqueRatios.length > 4) {
    violations.push({
      id: 'images-many-ratios',
      severity: 'warn',
      message: `${uniqueRatios.length} different aspect ratios — rec. ≤ 3`,
      hint: `Found: ${uniqueRatios.join(', ')}`
    })
  } else {
    violations.push({
      id: 'images-ratios-ok',
      severity: 'pass',
      message: `Aspect ratios: ${realRatios.join(', ')} — consistent`
    })
  }

  // ─── 3. Inconsistent ratios within the same components ───────────────────────
  if (inconsistentCards.length > 0) {
    violations.push({
      id: 'images-inconsistent-cards',
      severity: 'warn',
      message: `${inconsistentCards.length} component groups with different aspect ratios`,
      hint: inconsistentCards.slice(0, 3).join(' | ')
    })
  } else if (images.length > 1) {
    violations.push({
      id: 'images-consistent-ok',
      severity: 'pass',
      message: 'Aspect ratios are consistent across components'
    })
  }

  return violations
}
