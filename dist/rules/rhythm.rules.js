const TOLERANCE = 1; // acceptable deviation in pixels
// Checks if a number is a multiple of base (with ±1px tolerance)
function isMultipleOf(value, base) {
    if (base <= 0)
        return false;
    const remainder = value % base;
    return remainder <= TOLERANCE || remainder >= base - TOLERANCE;
}
// Percentage of values that are multiples of base
function scoreMultiples(values, base) {
    if (values.length === 0)
        return 100;
    const matches = values.filter(v => isMultipleOf(v, base)).length;
    return Math.round((matches / values.length) * 100);
}
// Finds outliers — values not divisible by any of the base values
function findOutliers(values, bases) {
    return [...new Set(values.filter(v => !bases.some(base => isMultipleOf(v, base))))].sort((a, b) => a - b);
}
// Detects the most likely base grid of the site (4 or 8px)
function detectGrid(values) {
    const score8 = scoreMultiples(values, 8);
    const score4 = scoreMultiples(values, 4);
    return score8 >= score4 - 15 ? 8 : 4; // prefer 8px when scores are close
}
export function checkRhythm(data) {
    const violations = [];
    const { rhythmUnit, bodyFontSize, bodyLineHeight } = data;
    // ─── 1. Rhythm Unit quality ─────────────────────────────────────
    const isRhythmUnitClean = rhythmUnit % 4 === 0;
    if (!isRhythmUnitClean) {
        violations.push({
            id: 'rhythm-unit-not-round',
            severity: 'warn',
            message: `Rhythm unit = ${rhythmUnit}px — not a multiple of 4px`,
            hint: `body: font-size ${bodyFontSize}px × line-height ${bodyLineHeight.toFixed(2)} = ${rhythmUnit}px. `
                + `Try line-height: ${(Math.round(bodyFontSize * bodyLineHeight / 4) * 4 / bodyFontSize).toFixed(3)} `
                + `to get a 4px-multiple rhythm unit`
        });
    }
    else {
        violations.push({
            id: 'rhythm-unit-ok',
            severity: 'pass',
            message: `Rhythm unit = ${rhythmUnit}px (${bodyFontSize}px × ${bodyLineHeight.toFixed(2)}) — multiple of 4px ✓`
        });
    }
    // ─── 2. Line-heights match rhythm unit ──────────────────
    const lhScore = scoreMultiples(data.uniqueLineHeights, rhythmUnit);
    const lhOutliers = findOutliers(data.uniqueLineHeights, [rhythmUnit, rhythmUnit / 2]);
    if (lhScore >= 80) {
        violations.push({
            id: 'line-heights-rhythm-ok',
            severity: 'pass',
            message: `Line-heights: ${lhScore}% match rhythm unit (${rhythmUnit}px)`
        });
    }
    else if (lhScore >= 50) {
        violations.push({
            id: 'line-heights-rhythm-warn',
            severity: 'warn',
            message: `Line-heights: only ${lhScore}% match rhythm unit (${rhythmUnit}px)`,
            hint: lhOutliers.length > 0
                ? `Outliers: ${lhOutliers.slice(0, 8).join('px, ')}px`
                : undefined
        });
    }
    else {
        violations.push({
            id: 'line-heights-rhythm-error',
            severity: 'error',
            message: `Line-heights: only ${lhScore}% match rhythm unit — no rhythm`,
            hint: lhOutliers.length > 0
                ? `Outliers: ${lhOutliers.slice(0, 8).join('px, ')}px`
                : undefined
        });
    }
    // ─── 3. Spacing — detect grid and validate ──────────────
    const allSpacing = [...data.uniqueMargins, ...data.uniquePaddings];
    const detectedGrid = detectGrid(allSpacing);
    const spacingScore4 = scoreMultiples(allSpacing, 4);
    const spacingScore8 = scoreMultiples(allSpacing, 8);
    const spacingOutliers = findOutliers(allSpacing, [4, 8]);
    violations.push({
        id: 'detected-grid',
        severity: 'pass',
        message: `Detected grid: ${detectedGrid}px (margin/padding: ${spacingScore8}% divisible by 8px, ${spacingScore4}% by 4px)`
    });
    if (spacingScore4 < 60) {
        violations.push({
            id: 'spacing-grid-error',
            severity: 'error',
            message: `Only ${spacingScore4}% of spacing values divisible by 4px — inconsistent spacing`,
            hint: spacingOutliers.length > 0
                ? `Outliers: ${spacingOutliers.slice(0, 10).join('px, ')}px`
                : undefined
        });
    }
    else if (spacingScore8 < 60) {
        violations.push({
            id: 'spacing-grid-warn',
            severity: 'warn',
            message: `${spacingScore8}% of spacing divisible by 8px — consider switching to an 8px grid`,
            hint: spacingOutliers.length > 0
                ? `Not divisible by 4px: ${spacingOutliers.slice(0, 10).join('px, ')}px`
                : undefined
        });
    }
    else {
        violations.push({
            id: 'spacing-grid-ok',
            severity: 'pass',
            message: `Spacing consistent: ${spacingScore8}% of values divisible by ${detectedGrid}px`
        });
    }
    // ─── 4. Too many unique margin values? ────────────────────
    const uniqueMarginCount = data.uniqueMargins.length;
    if (uniqueMarginCount > 15) {
        violations.push({
            id: 'too-many-margins',
            severity: 'error',
            message: `${uniqueMarginCount} unique margin values — recommendation: max 8–10`,
            hint: `All values: ${data.uniqueMargins.join('px, ')}px`
        });
    }
    else if (uniqueMarginCount > 10) {
        violations.push({
            id: 'many-margins',
            severity: 'warn',
            message: `${uniqueMarginCount} unique margin values — rec. 6–8`,
        });
    }
    else {
        violations.push({
            id: 'margins-ok',
            severity: 'pass',
            message: `Margin values: ${uniqueMarginCount} — OK`
        });
    }
    return violations;
}
