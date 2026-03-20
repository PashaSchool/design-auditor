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

### Lighthouse for design consistency

**One command. 9 audit modules. A score from 0 to 100.**

[![npm version](https://img.shields.io/npm/v/design-auditor?color=6366f1&style=flat-square)](https://www.npmjs.com/package/design-auditor)
[![npm downloads](https://img.shields.io/npm/dm/design-auditor?color=6366f1&style=flat-square)](https://www.npmjs.com/package/design-auditor)
[![CI](https://img.shields.io/github/actions/workflow/status/PashaSchool/design-auditor/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/PashaSchool/design-auditor/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/design-auditor?color=6366f1&style=flat-square)](LICENSE)
[![snyk](https://snyk.io/test/github/PashaSchool/design-auditor/badge.svg)](https://snyk.io/test/github/PashaSchool/design-auditor)
[![playwright](https://img.shields.io/badge/powered%20by-Playwright-45ba4b?style=flat-square)](https://playwright.dev)
[![website](https://img.shields.io/badge/docs-pashaschool.github.io%2Fdesign--auditor-FFE135?style=flat-square)](https://pashaschool.github.io/design-auditor/)

</div>

---

## What is this?

`design-auditor` opens any website in a real Chromium browser, inspects every element's computed styles, and scores design consistency across **9 modules** — typography, colors, spacing, components, readability, images, links, headings, and breakpoints.

```bash
npx design-auditor https://stripe.com
```

Think of it as **Lighthouse, but for your design system** — not performance, not SEO, but the visual coherence of your product.

| Tool               | What it checks                                            |
| ------------------ | --------------------------------------------------------- |
| **Lighthouse**     | Performance, SEO, best practices                          |
| **axe / WAVE**     | Accessibility compliance                                  |
| **Stylelint**      | CSS source code linting                                   |
| **design-auditor** | **Design system consistency** — the gap no one else fills |

---

## See it in action

![Design Auditor Preview](design-audit-preview.gif)

---

## Quick Start

```bash
# No installation needed
npx design-auditor https://stripe.com

# Audit only specific modules
npx design-auditor https://stripe.com --only colors,typography

# Local dev server
npx design-auditor http://localhost:3000 --local

# Save JSON report for CI
npx design-auditor https://stripe.com --save-report
```

---

## Scoring

Every audit produces a **weighted score from 0 to 100** with a letter grade:

```
┌──────────────────────────────────────────────────┐
│                DESIGN AUDIT SCORE                │
│                                                  │
│          72 / 100  —  Grade B (Good)             │
│                                                  │
│  Typography        ████████░░  82   (weight 15%) │
│  Colors            ██████░░░░  60   (weight 20%) │
│  Rhythm & Spacing  ████████░░  78   (weight 15%) │
│  Components        ██████░░░░  65   (weight 15%) │
│  Reading Width     █████████░  90   (weight 10%) │
│  Images            ████████░░  80   (weight 10%) │
│  Links             █████████░  85   (weight  5%) │
│  Headings          ██████████  100  (weight  5%) │
│  Breakpoints       ███████░░░  70   (weight  5%) │
└──────────────────────────────────────────────────┘
```

| Grade | Score  | Meaning                              |
| ----- | ------ | ------------------------------------ |
| **A** | 90-100 | Excellent — consistent design system |
| **B** | 75-89  | Good — minor inconsistencies         |
| **C** | 60-74  | Needs Work — visible design drift    |
| **D** | 40-59  | Poor — significant inconsistencies   |
| **F** | 0-39   | Critical — no design system detected |

Use `--save-report` to track your score over time and catch design drift in CI.

---

## 9 Audit Modules

### Typography `weight: 15%`

> _Good type is invisible. Bad type is everywhere._

- Font family count _(recommended: ≤ 3)_
- Unique font sizes and modular scale adherence
- Line-height consistency across text elements
- Outlier sizes that break the visual rhythm

### Colors `weight: 20%`

> _A brand is not a logo. It's a consistent palette._

- Unique color count across the entire page
- **Similar shade clustering** using delta-E color science
- Auto-detection of **primary / secondary / accent** colors by usage frequency
- **WCAG AA contrast** validation for all text/background pairs
- **CSS variable coverage** — are colors tokenized or hardcoded?

### Vertical Rhythm & Spacing `weight: 15%`

> _The baseline grid is the heartbeat of a layout._

- Rhythm unit detection `(font-size x line-height)`
- Line-heights as multiples of the rhythm unit
- **4px / 8px grid** adherence for margins and paddings
- Outlier spacing values like `13px`, `17px`, `22px`

### Components `weight: 15%`

> _Inconsistent buttons are a symptom of an inconsistent system._

- Touch target sizes _(minimum 44x44px per WCAG 2.5.5)_
- Button padding variations _(recommended: ≤ 3 sizes — sm/md/lg)_
- `:hover` and `:focus` interactive states
- Border-radius system _(recommended: ≤ 5 values)_
- Box-shadow elevation levels and light direction consistency
- Z-index organization and "magic numbers"

### Reading Width `weight: 10%`

> _If a line is too long, the reader's eye has a hard time finding the next line._

- Average line character count _(optimal: 45-75 characters)_
- Percentage of text blocks within optimal reading width
- Flags text containers that are too wide (>85 chars) or too narrow (<30 chars)

### Images `weight: 10%`

> _Every image without alt text is a door slammed on a screen reader user._

- Alt text coverage _(error if >30% missing)_
- Aspect ratio consistency _(recommended: ≤ 3 unique ratios)_
- Inconsistent ratios within component groups (e.g. cards with mixed image proportions)

### Links `weight: 5%`

> _A link distinguished only by color is invisible to 8% of men._

- **WCAG 1.4.1** — links must not rely on color alone (needs underline or other indicator)
- Link color consistency across the page
- `:visited` state defined
- `:focus` state for keyboard navigation _(WCAG 2.4.7)_

### Headings `weight: 5%`

> _Headings are the table of contents your DOM never knew it had._

- Exactly one `<h1>` per page
- Logical heading order (no skipped levels like H2 → H4)
- Visual size hierarchy — higher-level headings must appear larger
- Deep nesting warnings (excessive H5/H6 usage)

### Breakpoints `weight: 5%`

> _A responsive design without a breakpoint system is just a flexible mess._

- Known system detection (Bootstrap, Tailwind, etc.)
- Breakpoint count _(recommended: 4-6, error if >8)_
- Strategy check — mobile-first vs desktop-first vs mixed
- Non-standard breakpoint values

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
  SCORE: 72 / 100 — Grade B (Good)
────────────────────────────────────────────────────────────
```

Every color is rendered as a **live color swatch** right in your terminal.

---

## How it works

```
URL  →  Playwright opens a real Chromium browser
         │
         ├── page.evaluate()  ←  runs inside the browser
         │   └── getComputedStyle() on every element
         │       returns actual rendered values
         │
         ├── 9 Extractors collect raw data
         │   ├── typography.ts     — fonts, sizes, line-heights
         │   ├── colors.ts         — delta-E clustering, WCAG contrast
         │   ├── rhythm.ts         — spacing, margins, grid detection
         │   ├── components.ts     — buttons, shadows, z-index
         │   ├── reading-width.ts  — line character counts
         │   ├── images.ts         — alt text, aspect ratios
         │   ├── links.ts          — states, color-only distinction
         │   ├── headings.ts       — hierarchy, visual sizing
         │   └── breakpoints.ts    — media query analysis
         │
         ├── Rules engine evaluates violations (pass / warn / error)
         │
         └── Score calculator → weighted 0-100 score + grade
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
                         Values: typography, colors, spacing, components,
                         reading-width, images, links, headings, breakpoints
  --save-report          Save full report as JSON file
  --local                Optimize for local dev servers (disables networkidle)
  -V, --version          Show version number
  -h, --help             Show help
```

---

## JSON Report

With `--save-report`, the full audit is saved as structured JSON — perfect for CI pipelines, dashboards, or tracking design drift over time.

```json
{
  "url": "https://stripe.com",
  "date": "2026-02-27T10:00:00.000Z",
  "score": {
    "overall": 72,
    "grade": "B",
    "label": "Good"
  },
  "summary": {
    "pass": 7,
    "warn": 5,
    "error": 3
  },
  "modules": [
    {
      "name": "Colors",
      "score": 60,
      "weight": 20,
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

> **A design system is a set of constraints. Audit tools should enforce them.**

Most automated tools check if your site _works_ (Lighthouse) or if it's _accessible_ (axe). `design-auditor` checks if your site is _consistent_ — the thing that's hardest to maintain as teams grow.

Based on established standards:

- [WCAG 2.1 / 2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) — touch targets, contrast ratios, link distinction
- [8-Point Grid System](https://spec.fm/specifics/8-pt-grid) — spacing consistency
- [Modular Scale](https://www.modularscale.com/) — typographic hierarchy
- [CIE delta-E](http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE76.html) — perceptual color similarity
- [60-30-10 rule](https://www.interaction-design.org/literature/article/ui-color-palette) — color balance

---

## Installation

```bash
# Run without installing
npx design-auditor https://stripe.com

# Or install globally
npm install -g design-auditor
design-auditor https://stripe.com
```

**Requirements:** Node.js 18+

---

## Contributing

Contributions are welcome! Whether it's a bug fix, a new audit rule, or an improvement to an existing module — open an issue or submit a PR.

```bash
git clone https://github.com/PashaSchool/design-auditor.git
cd design-auditor
npm install
npx playwright install chromium
npm run dev -- https://example.com
```

See [open issues](https://github.com/PashaSchool/design-auditor/issues) for ideas on where to start.

---

## Limitations

- Audits only the **first page** at the given URL (no multi-page crawl yet)
- JavaScript-heavy SPAs may need a few seconds to fully render — use `--local` for dev servers
- Media query analysis reads CSS source rules; dynamically injected media queries may be missed
- Color extraction uses computed styles — colors set via `canvas`, `svg`, or `background-image` gradients are not captured

---

## Security

[![snyk](https://snyk.io/test/github/PashaSchool/design-auditor/badge.svg)](https://snyk.io/test/github/PashaSchool/design-auditor)

All dependencies are continuously scanned for vulnerabilities using **Snyk**.

---

## License

MIT — use it, fork it, build on it.

---

<div align="center">

Built with care for designers who care about consistency.

[Read the story behind design-auditor on dev.to](https://dev.to/__aa5b04f75e3a/i-built-a-cli-that-catches-design-inconsistencies-like-lighthouse-but-for-your-design-system-nc7)

</div>
