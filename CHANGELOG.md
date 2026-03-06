# Changelog

## [1.0.1] - 2026-03-06

### Fixed
- Links rule: duplicate `:visited` condition
- Colors extractor: CSS variable coverage now scans `CSSStyleRule.style.getPropertyValue()` across all stylesheets
- Typography rules: added `pass` violation for modular scale check
- Typography extractor: filter out `display:none` / `visibility:hidden` elements
- Reading width: removed `section` and `main` from text tags (layout containers caused false positives)
- Breakpoints extractor: use `matchAll()` to capture both values in complex queries

### Added
- Test suite with Vitest (unit + rule tests)
- CI workflow (build, format, test on Node 18/20/22)
- CONTRIBUTING.md

## [1.0.0] - 2026-02-27

### Added
- Initial release
- 9 audit modules: typography, colors, vertical rhythm, components, reading width, images, links, breakpoints, headings
- Terminal reporter with color swatches
- JSON report export (`--save-report`)
- Module filtering (`--only`)
- Weighted scoring system (A-F grades)
- WCAG contrast checking (AA)
- Delta-E color clustering
- Modular scale detection
- 4px/8px grid detection
- Known breakpoint system detection (Tailwind, Bootstrap, etc.)
