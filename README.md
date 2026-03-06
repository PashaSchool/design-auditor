<div align="center">

```
██████╗ ███████╗███████╗██╗ ██████╗ ███╗   ██╗
██╔══██╗██╔════╝██╔════╝██║██╔════╝ ████╗  ██║
██║  ██║█████╗  ███████╗██║██║  ███╗██╔██╗ ██║
██║  ██║██╔══╝  ╚════██║██║██║   ██║██║╚██╗██║
██████╔╝███████╗███████║██║╚██████╔╝██║ ╚████║
╚═════╝ ╚══════╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
          A U D I T O R
```

**Catch design inconsistencies before your users do.**

[![npm version](https://img.shields.io/npm/v/design-auditor?color=6366f1&style=flat-square)](https://www.npmjs.com/package/design-auditor)
[![npm downloads](https://img.shields.io/npm/dm/design-auditor?color=6366f1&style=flat-square)](https://www.npmjs.com/package/design-auditor)
[![CI](https://img.shields.io/github/actions/workflow/status/PashaSchool/design-auditor/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/PashaSchool/design-auditor/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/design-auditor?color=6366f1&style=flat-square)](LICENSE)
[![snyk](https://snyk.io/test/github/PashaSchool/design-auditor/badge.svg)](https://snyk.io/test/github/PashaSchool/design-auditor)
[![playwright](https://img.shields.io/badge/powered%20by-Playwright-45ba4b?style=flat-square)](https://playwright.dev)
[![website](https://img.shields.io/badge/website-pashaschool.github.io%2Fdesign--auditor-FFE135?style=flat-square)](https://pashaschool.github.io/design-auditor/)

</div>

---

## Security

[![snyk](https://snyk.io/test/github/PashaSchool/design-auditor/badge.svg)](https://snyk.io/test/github/PashaSchool/design-auditor)

All dependencies are continuously scanned for vulnerabilities using **Snyk**. Click the badge to see detailed security reports. Security is a first-class concern, not an afterthought.

---

## What is this?

`design-auditor` is a CLI tool that crawls any website using a real browser and checks it against established design system best practices.

It answers questions like:

- _"How many fonts are we actually using on this page?"_
- _"Are all these shades of blue really necessary, or can we unify them?"_
- _"Does our spacing follow a consistent 8px grid?"_
- _"Which buttons are too small to tap on mobile?"_

Think of it as **Lighthouse for design consistency** — not performance, not SEO, but the visual coherence of your product.

---

## See it in action

![Design Auditor Preview](design-audit-preview.gif)

---

## Quick Start

```bash
# No installation needed
npx design-auditor https://yoursite.com

# Save report to JSON
npx design-auditor https://yoursite.com --save-report

# Local dev server
npx design-auditor http://localhost:3000
```

---

## What it checks

### Typography

> _Good type is invisible. Bad type is everywhere._

- Number of font families in use _(recommended: ≤ 3)_
- Unique font sizes and whether they follow a modular scale
- Line-height consistency across text elements
- Outlier sizes that break the visual rhythm

### Vertical Rhythm & Spacing

> _The baseline grid is the heartbeat of a layout._

- Detects your site's rhythm unit `(font-size × line-height)`
- Checks if line-heights are multiples of the rhythm unit
- Identifies whether spacing follows a **4px or 8px grid**
- Flags margin/padding outliers like `13px`, `17px`, `22px`

### Colors

> _A brand is not a logo. It's a consistent palette._

- Counts unique colors across the entire page
- Clusters **visually similar shades** using delta-E color science
- Auto-detects **primary / secondary / accent** colors by usage frequency
- Validates **WCAG AA contrast** for all text/background pairs
- Checks **CSS variable coverage** — are colors tokenized or hardcoded?

### Components

> _Inconsistent buttons are a symptom of an inconsistent system._

- Touch target sizes _(minimum 44×44px per WCAG 2.5.5)_
- Button padding variations _(recommended: ≤ 3 sizes — sm/md/lg)_
- Presence of `:hover` and `:focus` interactive states
- Border-radius system _(recommended: ≤ 5 values)_
- Box-shadow elevation levels and light direction consistency
- Z-index organization and "magic numbers"

---

## Output

```
────────────────────────────────────────────────────────────
  TYPOGRAPHY
────────────────────────────────────────────────────────────
  ✅ Font families: 2 — OK
  ⚠️  Font sizes: 11 unique — recommended ≤ 8
     Found: 12px 14px 16px 18px 22px 24px 32px 40px 48px 56px 64px
  ❌ Line-heights: 22 unique — no vertical rhythm
     Too many line-height values — no baseline grid detected

  COLORS
────────────────────────────────────────────────────────────
  ❌ 54 unique colors found — recommended < 20
  ❌ 40 similar color pairs — palette can be consolidated
     ██ #f0f6fc ≈ ██ #f6f8fa (ΔE=2.6)
     ██ #24292f ≈ ██ #1f2328 (ΔE=2.9)
  ✅ Primary:   ██ #79c0ff  (262 uses)
  ✅ Secondary: ██ #59636e  (100 uses)
  ✅ Color balance: 63% / 24% / 2% — close to 60/30/10 rule

  COMPONENTS
────────────────────────────────────────────────────────────
  ❌ 28/50 buttons smaller than 44px touch target (56%)
     "Sign up" 101×32px, "Explore" 94×36px
  ⚠️  Buttons: 11 padding variations — recommended ≤ 3
  ✅ Interactive states: :hover and :focus present
  ❌ 12 unique border-radius values — recommended ≤ 5

────────────────────────────────────────────────────────────
  SUMMARY:  6 ❌  5 ⚠️   7 ✅
────────────────────────────────────────────────────────────
```

Every color is rendered as a **live color swatch** right in your terminal.

---

## How it works

```
URL  →  Playwright opens a real browser
         │
         ├── page.evaluate()  ←  runs inside the browser
         │   └── getComputedStyle() on every element
         │       returns actual rendered values
         │
         ├── Extractors process raw data
         │   ├── typography.ts   — fonts, sizes, line-heights
         │   ├── rhythm.ts       — spacing, margins, grid detection
         │   ├── colors.ts       — delta-E clustering, WCAG contrast
         │   └── components.ts   — buttons, shadows, z-index
         │
         └── Rules engine scores everything
             └── Terminal reporter renders results
```

**Unlike static CSS analysis**, `design-auditor` uses a real browser — so it sees computed styles, not source code. It catches values injected by JavaScript, CSS custom properties resolved at runtime, and styles applied by third-party scripts.

---

## Options

```bash
design-auditor <url> [options]

Arguments:
  url                    Website URL to audit

Options:
  --only <modules>       Run specific modules only
                         Values: typography, colors, spacing, components
  --save-report          Save full report as JSON file
  --local                Optimize for local dev servers (disables networkidle)
  -V, --version          Show version number
  -h, --help             Show help
```

### Examples

```bash
# Audit a production site
npx design-auditor https://yourcompany.com

# Only check colors and typography
npx design-auditor https://yourcompany.com --only colors,typography

# Local Next.js / Vite dev server
npx design-auditor http://localhost:3000 --local

# Save JSON report for CI or comparison
npx design-auditor https://yourcompany.com --save-report
# → design-audit-yourcompany-com-2026-02-27.json
```

---

## JSON Report

With `--save-report`, the full audit is saved as structured JSON — perfect for CI pipelines, dashboards, or tracking design drift over time.

```json
{
  "url": "https://yoursite.com",
  "date": "2026-02-27T10:00:00.000Z",
  "summary": {
    "pass": 7,
    "warn": 5,
    "error": 3
  },
  "modules": [
    {
      "name": "Colors",
      "violations": [
        {
          "id": "too-many-colors",
          "severity": "error",
          "message": "54 unique colors found — recommended < 20",
          "hint": "A large palette makes maintenance harder..."
        }
      ]
    }
  ]
}
```

---

## Design philosophy

This tool is built around one idea:

> **A design system is a set of constraints. Audit tools should enforce them.**

Most automated tools check if your site _works_ (Lighthouse) or if it _renders_ (Playwright visual regression). `design-auditor` checks if your site is _consistent_ — the thing that's hardest to maintain as teams grow.

The checks in this tool are based on:

- [WCAG 2.1 / 2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) — touch target sizes, contrast ratios
- [8-Point Grid System](https://spec.fm/specifics/8-pt-grid) — spacing consistency
- [Modular Scale](https://www.modularscale.com/) — typographic hierarchy
- [CIE delta-E color difference](http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE76.html) — perceptual color similarity
- [60-30-10 color rule](https://www.interaction-design.org/literature/article/ui-color-palette) — color balance

---

## Installation (global)

```bash
# Run without installing
npx design-auditor https://yoursite.com

# Or install globally
npm install -g design-auditor
design-auditor https://yoursite.com
```

**Requirements:** Node.js 18+

---

## License

MIT — use it, fork it, build on it.

---

<div align="center">

Built with care for designers who care about consistency.

---

## 📖 Read more

[I built a CLI that catches design inconsistencies — like Lighthouse, but for your design system](https://dev.to/__aa5b04f75e3a/i-built-a-cli-that-catches-design-inconsistencies-like-lighthouse-but-for-your-design-system-nc7)

</div>
