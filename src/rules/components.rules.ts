import { ComponentsData } from '@extractors/components.js'
import { Violation } from '@/types.js'

const MIN_TOUCH_TARGET = 44  // px — WCAG 2.5.5 recommendation

// Checks if a border-radius value is "circular" (50% or very large)
function isCircle(r: string): boolean {
  return r.includes('50%') || parseFloat(r) >= 9999
}

// Normalize border-radius to a single number (take first value)
function normalizeRadius(r: string): number {
  return parseFloat(r.split(' ')[0])
}

// Checks if a value is in the radius scale (0, 2, 4, 6, 8, 12, 16, 24px + circles)
function isInRadiusScale(r: string): boolean {
  if (isCircle(r)) return true
  const val = normalizeRadius(r)
  const scale = [0, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32]
  return scale.includes(val)
}

export function checkComponents(data: ComponentsData): Violation[] {
  const violations: Violation[] = []
  const { buttons } = data

  // ─── 1. Touch Targets ────────────────────────────────────────────────────────
  if (buttons.length > 0) {
    const tooSmall = buttons.filter(b => b.height < MIN_TOUCH_TARGET && b.height > 0)
    const pct = Math.round((tooSmall.length / buttons.length) * 100)

    if (tooSmall.length > 0) {
      const examples = tooSmall
        .slice(0, 3)
        .map(b => `"${b.text || b.tag}" ${b.width}×${b.height}px`)
        .join(', ')
      violations.push({
        id: 'touch-targets',
        severity: tooSmall.length > buttons.length * 0.3 ? 'error' : 'warn',
        message: `${tooSmall.length}/${buttons.length} buttons smaller than ${MIN_TOUCH_TARGET}px (${pct}%)`,
        hint: `Examples: ${examples}`
      })
    } else {
      violations.push({
        id: 'touch-targets-ok',
        severity: 'pass',
        message: `Touch targets: all ${buttons.length} buttons ≥ ${MIN_TOUCH_TARGET}px`
      })
    }
  }

  // ─── 2. Padding consistency ──────────────────────────────────────────────────
  if (buttons.length >= 2) {
    const paddingVariants = new Set(
      buttons.map(b => `${b.paddingTop}/${b.paddingRight}/${b.paddingBottom}/${b.paddingLeft}`)
    )

    if (paddingVariants.size > 4) {
      violations.push({
        id: 'button-padding',
        severity: 'warn',
        message: `Buttons: ${paddingVariants.size} padding variations — rec. ≤ 3`,
        hint: 'Different paddings often indicate missing button size variants (sm/md/lg)'
      })
    } else {
      violations.push({
        id: 'button-padding-ok',
        severity: 'pass',
        message: `Button padding: ${paddingVariants.size} variations — OK`
      })
    }
  }

  // ─── 3. Cursor pointer ───────────────────────────────────────────────────────
  if (buttons.length > 0) {
    const noCursor = buttons.filter(b => b.cursor !== 'pointer')
    if (noCursor.length > 0) {
      violations.push({
        id: 'button-cursor',
        severity: 'warn',
        message: `${noCursor.length} buttons without cursor: pointer`,
        hint: noCursor.slice(0, 3).map(b => `"${b.text || b.tag}"`).join(', ')
      })
    } else {
      violations.push({
        id: 'button-cursor-ok',
        severity: 'pass',
        message: 'Cursor pointer: all buttons have pointer'
      })
    }
  }

  // ─── 4. Hover / Focus states ─────────────────────────────────────────────────
  if (buttons.length > 0) {
    const first = buttons[0]
    if (!first.hasHoverStyle) {
      violations.push({
        id: 'no-hover-styles',
        severity: 'warn',
        message: 'Button hover states not found in CSS',
        hint: 'Make sure :hover styles are defined'
      })
    }
    if (!first.hasFocusStyle) {
      violations.push({
        id: 'no-focus-styles',
        severity: 'error',
        message: 'Focus states not found — accessibility issue',
        hint: 'Add :focus or :focus-visible styles for keyboard navigation'
      })
    }
    if (first.hasHoverStyle && first.hasFocusStyle) {
      violations.push({
        id: 'interactive-states-ok',
        severity: 'pass',
        message: 'Interactive states: :hover and :focus are present'
      })
    }
  }

  // ─── 5. Border Radius system ─────────────────────────────────────────────────
  const radii = data.uniqueRadii.filter(r => !isCircle(r))
  const uniqueCount = radii.length

  if (uniqueCount > 6) {
    const outliers = radii.filter(r => !isInRadiusScale(r))
    violations.push({
      id: 'too-many-radii',
      severity: 'error',
      message: `${uniqueCount} unique border-radius values — rec. ≤ 5`,
      hint: outliers.length > 0
        ? `Outliers (not in scale): ${outliers.slice(0, 6).join(', ')}`
        : `Values: ${radii.slice(0, 8).join(', ')}`
    })
  } else if (uniqueCount > 4) {
    violations.push({
      id: 'many-radii',
      severity: 'warn',
      message: `${uniqueCount} unique border-radius values — rec. 3–4`,
      hint: `Values: ${radii.join(', ')}`
    })
  } else {
    violations.push({
      id: 'radii-ok',
      severity: 'pass',
      message: `Border-radius: ${uniqueCount} unique values — OK`
    })
  }

  // ─── 6. Shadow system ────────────────────────────────────────────────────────
  const shadowCount = data.shadows.length

  if (shadowCount === 0) {
    violations.push({
      id: 'no-shadows',
      severity: 'pass',
      message: 'Shadows: not used'
    })
  } else if (shadowCount > 8) {
    violations.push({
      id: 'too-many-shadows',
      severity: 'error',
      message: `${shadowCount} unique shadows — rec. ≤ 6 elevation levels`,
      hint: 'Shadow system should be: sm / md / lg / xl / 2xl'
    })
  } else {
    // check light source direction consistency
    const negativeY = data.shadows.filter(s => s.offsetY < 0)
    if (negativeY.length > 0 && negativeY.length < shadowCount) {
      violations.push({
        id: 'shadow-direction',
        severity: 'warn',
        message: 'Inconsistent shadow direction — mixed light sources',
        hint: `${negativeY.length} shadow(s) with negative offsetY (shadow above)`
      })
    } else {
      violations.push({
        id: 'shadows-ok',
        severity: 'pass',
        message: `Shadows: ${shadowCount} levels — OK`
      })
    }
  }

  // ─── 7. Z-index system ───────────────────────────────────────────────────────
  const zCount = data.zIndices.length
  const magicNumbers = data.zIndices.filter(z => z > 1000 && z !== 9999 && z % 100 !== 0)

  if (zCount > 10) {
    violations.push({
      id: 'too-many-zindex',
      severity: 'warn',
      message: `${zCount} unique z-index values — system may be chaotic`,
      hint: `Values: ${data.zIndices.slice(0, 10).join(', ')}...`
    })
  } else if (magicNumbers.length > 0) {
    violations.push({
      id: 'zindex-magic',
      severity: 'warn',
      message: `"Magic numbers" in z-index: ${magicNumbers.join(', ')}`,
      hint: 'Use a system: 100 (dropdown), 200 (sticky), 300 (modal), 400 (toast)'
    })
  } else {
    violations.push({
      id: 'zindex-ok',
      severity: 'pass',
      message: `Z-index: ${zCount} levels — OK`
    })
  }

  return violations
}
