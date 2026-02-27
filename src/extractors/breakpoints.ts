import { Page } from 'playwright'

export interface BreakpointEntry {
  value:    number   // px
  query:    string   // original string: "(max-width: 768px)"
  type:     'max-width' | 'min-width' | 'other'
  count:    number   // how many rules use this breakpoint
}

export interface BreakpointsData {
  breakpoints:    BreakpointEntry[]
  uniqueValues:   number[]
  strategy:       'mobile-first' | 'desktop-first' | 'mixed' | 'none'
  knownSystem:    string | null   // Tailwind / Bootstrap / custom
}

// Known design systems and their breakpoints
const KNOWN_SYSTEMS: Array<{ name: string; values: number[]; tolerance: number }> = [
  {
    name: 'Tailwind CSS',
    values: [640, 768, 1024, 1280, 1536],
    tolerance: 8,
  },
  {
    name: 'Bootstrap 5',
    values: [576, 768, 992, 1200, 1400],
    tolerance: 8,
  },
  {
    name: 'Material UI',
    values: [600, 900, 1200, 1536],
    tolerance: 8,
  },
]

function detectKnownSystem(values: number[]): string | null {
  for (const system of KNOWN_SYSTEMS) {
    const matches = system.values.filter(sv =>
      values.some(v => Math.abs(v - sv) <= system.tolerance)
    )
    // if more than half the values match — it's this system
    if (matches.length >= Math.floor(system.values.length * 0.5)) {
      return system.name
    }
  }
  return null
}

export async function extractBreakpoints(page: Page): Promise<BreakpointsData> {
  const raw = await page.evaluate(() => {
    const bpMap = new Map<string, { query: string; count: number }>()

    try {
      const sheets = Array.from(document.styleSheets)

      for (const sheet of sheets) {
        let rules: CSSRuleList

        try {
          rules = sheet.cssRules
        } catch {
          continue  // cross-origin stylesheet
        }

        const processRules = (ruleList: CSSRuleList) => {
          for (const rule of Array.from(ruleList)) {
            if (rule instanceof CSSMediaRule) {
              const condition = rule.conditionText || rule.media?.mediaText || ''

              // extract numeric value from "(max-width: 768px)"
              const match = condition.match(/\((?:max|min)-width:\s*(\d+(?:\.\d+)?)(px|em|rem)\)/i)
              if (match) {
                let value = parseFloat(match[1])
                const unit  = match[2].toLowerCase()

                // convert em/rem to px (approximately, based on 16px)
                if (unit === 'em' || unit === 'rem') value = Math.round(value * 16)

                const key = `${value}`
                if (!bpMap.has(key)) {
                  bpMap.set(key, { query: condition, count: 0 })
                }
                bpMap.get(key)!.count++
              }

              // recursively process nested rules
              if (rule.cssRules) processRules(rule.cssRules)
            }
          }
        }

        processRules(rules)
      }
    } catch { /* ignore */ }

    return Array.from(bpMap.entries()).map(([value, data]) => ({
      value:  parseInt(value),
      query:  data.query,
      count:  data.count,
    }))
  })

  // determine breakpoint type (min or max)
  const breakpoints: BreakpointEntry[] = raw
    .map(bp => ({
      value: bp.value,
      query: bp.query,
      type: bp.query.includes('max-width')
        ? 'max-width' as const
        : bp.query.includes('min-width')
          ? 'min-width' as const
          : 'other' as const,
      count: bp.count,
    }))
    .sort((a, b) => a.value - b.value)

  const uniqueValues = breakpoints.map(bp => bp.value)

  // strategy: mobile-first = predominantly min-width
  const minCount = breakpoints.filter(bp => bp.type === 'min-width').length
  const maxCount = breakpoints.filter(bp => bp.type === 'max-width').length
  const strategy =
    breakpoints.length === 0 ? 'none' :
    minCount > 0 && maxCount > 0 ? 'mixed' :
    minCount > maxCount ? 'mobile-first' : 'desktop-first'

  const knownSystem = detectKnownSystem(uniqueValues)

  return { breakpoints, uniqueValues, strategy, knownSystem }
}
