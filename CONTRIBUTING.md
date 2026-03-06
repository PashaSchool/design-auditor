# Contributing to design-auditor

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/PashaSchool/design-auditor.git
cd design-auditor
npm install
```

## Running Locally

```bash
# Run against a URL
npm run dev -- https://example.com

# Run tests
npm test

# Check formatting
npm run format:check

# Auto-format
npm run format
```

## Project Structure

```
src/
  extractors/   — Playwright page.evaluate() data collection
  rules/        — Violation checks (pass/warn/error)
  reporters/    — Terminal + JSON output
  utils/        — Color math, score calculation
  types.ts      — Core types (Violation, ModuleReport)
```

**Data flow:** URL -> Extractor (browser) -> Rules (pure functions) -> Reporter (terminal/JSON)

## Adding a New Rule

1. Create an extractor in `src/extractors/` that collects data via `page.evaluate()`
2. Create a rule in `src/rules/` — a pure function that takes extracted data and returns `Violation[]`
3. Add tests in `tests/rules/` with mock data (no browser needed)
4. Wire it up in `src/index.ts`

Rules should always push a `pass` violation when things are OK — this affects the score denominator.

## Code Style

- TypeScript strict mode
- Prettier for formatting (run `npm run format` before committing)
- No lint warnings in CI

## Pull Requests

1. Fork the repo and create a feature branch
2. Make your changes
3. Add/update tests
4. Run `npm test && npm run format:check && npm run build`
5. Open a PR with a clear description of the change

## Reporting Bugs

Open an issue with:
- The URL you audited (if public)
- Expected vs actual behavior
- Node.js version and OS
