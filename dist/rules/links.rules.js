export function checkLinks(data) {
    const violations = [];
    const { links, uniqueColors, noUnderlineNoAlt, inconsistentColors, hasVisitedStyle, hasFocusStyle } = data;
    if (links.length === 0) {
        violations.push({
            id: 'links-none',
            severity: 'pass',
            message: 'Links: none found'
        });
        return violations;
    }
    // ─── 1. WCAG 1.4.1 — links ≠ color only ─────────────────────────────────────
    if (noUnderlineNoAlt.length > 0) {
        const examples = noUnderlineNoAlt
            .slice(0, 3)
            .map(l => `"${l.text}"`)
            .join(', ');
        violations.push({
            id: 'links-color-only',
            severity: 'error',
            message: `${noUnderlineNoAlt.length} links distinguished from text by color only`,
            hint: `WCAG 1.4.1: ${examples} — add underline or another visual indicator`
        });
    }
    else {
        violations.push({
            id: 'links-wcag-ok',
            severity: 'pass',
            message: 'WCAG 1.4.1: links have a visual indicator beyond color'
        });
    }
    // ─── 2. Color consistency ─────────────────────────────────────────────────────
    if (inconsistentColors) {
        violations.push({
            id: 'links-inconsistent-colors',
            severity: 'warn',
            message: `${uniqueColors.length} different link colors — rec. 1–2`,
            hint: 'Different link colors on the same page break visual language'
        });
    }
    else {
        violations.push({
            id: 'links-colors-ok',
            severity: 'pass',
            message: `Link colors: ${uniqueColors.length} variations — consistent`
        });
    }
    // ─── 3. :visited state ───────────────────────────────────────────────────────
    if (!hasVisitedStyle) {
        violations.push({
            id: 'links-no-visited',
            severity: 'warn',
            message: ':visited state not defined in CSS',
            hint: ':visited state helps users understand where they have already been'
        });
    }
    else {
        violations.push({
            id: 'links-visited-ok',
            severity: 'pass',
            message: ':visited state defined'
        });
    }
    // ─── 4. :focus state ─────────────────────────────────────────────────────────
    if (!hasFocusStyle) {
        violations.push({
            id: 'links-no-focus',
            severity: 'error',
            message: ':focus state not defined — keyboard navigation inaccessible',
            hint: 'Add :focus or :focus-visible styles (WCAG 2.4.7)'
        });
    }
    else {
        violations.push({
            id: 'links-focus-ok',
            severity: 'pass',
            message: ':focus state defined'
        });
    }
    return violations;
}
