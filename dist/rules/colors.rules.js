import { rgbToHex, deltaE } from '../utils/color.js';
const DELTA_E_MERGE_THRESHOLD = 4; // colors closer than this are merge candidates
export function checkColors(data) {
    const violations = [];
    // ─── 1. Total unique colors ──────────────────────────────────────────────────
    const total = data.all.length;
    if (total > 30) {
        violations.push({
            id: 'too-many-colors',
            severity: 'error',
            message: `${total} unique colors found — recommendation: max 15–20`,
            hint: 'Too large a palette makes maintenance harder and hurts brand consistency'
        });
    }
    else if (total > 15) {
        violations.push({
            id: 'many-colors',
            severity: 'warn',
            message: `${total} unique colors — rec. 10–15`,
        });
    }
    else {
        violations.push({
            id: 'colors-count-ok',
            severity: 'pass',
            message: `Unique colors: ${total} — OK`
        });
    }
    // ─── 2. Similar shades — merge candidates ────────────────────────────────────
    const mergeCandidates = [];
    for (let i = 0; i < data.all.length; i++) {
        for (let j = i + 1; j < data.all.length; j++) {
            const hexA = rgbToHex(data.all[i].rgb);
            const hexB = rgbToHex(data.all[j].rgb);
            // skip identical colors (may differ in alpha)
            if (hexA === hexB)
                continue;
            const de = deltaE(data.all[i].lab, data.all[j].lab);
            if (de < DELTA_E_MERGE_THRESHOLD) {
                mergeCandidates.push([hexA, hexB, Math.round(de * 10) / 10]);
            }
        }
    }
    if (mergeCandidates.length > 5) {
        const examples = mergeCandidates
            .slice(0, 4)
            .map(([a, b, de]) => `${a}≈${b} (ΔE=${de})`)
            .join(', ');
        violations.push({
            id: 'similar-colors',
            severity: 'error',
            message: `${mergeCandidates.length} similar color pairs — palette could be reduced`,
            hint: `Examples: ${examples}`
        });
    }
    else if (mergeCandidates.length > 0) {
        const examples = mergeCandidates
            .map(([a, b, de]) => `${a}≈${b} (ΔE=${de})`)
            .join(', ');
        violations.push({
            id: 'few-similar-colors',
            severity: 'warn',
            message: `${mergeCandidates.length} similar color pairs`,
            hint: examples
        });
    }
    else {
        violations.push({
            id: 'no-similar-colors',
            severity: 'pass',
            message: 'No similar colors found — palette is clean'
        });
    }
    // ─── 3. Primary / Secondary / Accent detection ───────────────────────────────
    if (data.primaryCandidate) {
        const hex = rgbToHex(data.primaryCandidate.rgb);
        const count = data.primaryCandidate.count;
        violations.push({
            id: 'primary-detected',
            severity: 'pass',
            message: `Primary: ${hex} (${count} uses)`,
        });
    }
    if (data.secondaryCandidate) {
        const hex = rgbToHex(data.secondaryCandidate.rgb);
        violations.push({
            id: 'secondary-detected',
            severity: 'pass',
            message: `Secondary: ${hex} (${data.secondaryCandidate.count} uses)`,
        });
    }
    // Check 60-30-10 rule
    if (data.brandColors.length >= 3) {
        const totalBrandUsage = data.brandColors.reduce((s, c) => s + c.totalCount, 0);
        const [p, s, a] = data.brandColors.map(c => c.totalCount / totalBrandUsage * 100);
        const isBalanced = p <= 70 && s <= 40 && a <= 20;
        if (!isBalanced) {
            violations.push({
                id: 'color-balance',
                severity: 'warn',
                message: `Brand color distribution: ${Math.round(p)}% / ${Math.round(s)}% / ${Math.round(a)}%`,
                hint: 'Recommendation 60/30/10: primary 60%, secondary 30%, accent 10%'
            });
        }
        else {
            violations.push({
                id: 'color-balance-ok',
                severity: 'pass',
                message: `Color balance: ${Math.round(p)}% / ${Math.round(s)}% / ${Math.round(a)}% — close to 60/30/10`
            });
        }
    }
    // ─── 4. WCAG Contrast ────────────────────────────────────────────────────────
    const failing = data.contrastPairs.filter(p => !p.passesAA);
    const uniqueFailing = failing.filter((p, i, arr) => arr.findIndex(x => x.textHex === p.textHex && x.bgHex === p.bgHex) === i);
    if (uniqueFailing.length > 5) {
        const examples = uniqueFailing.slice(0, 3)
            .map(p => `${p.textHex} on ${p.bgHex} (${p.contrast}:1)`)
            .join(', ');
        violations.push({
            id: 'contrast-fail',
            severity: 'error',
            message: `${uniqueFailing.length} color pairs fail WCAG AA`,
            hint: `Examples: ${examples}`
        });
    }
    else if (uniqueFailing.length > 0) {
        const examples = uniqueFailing
            .map(p => `${p.textHex} on ${p.bgHex} (${p.contrast}:1 — needs ${p.fontSize >= 18 ? '3' : '4.5'}:1)`)
            .join(', ');
        violations.push({
            id: 'contrast-warn',
            severity: 'warn',
            message: `${uniqueFailing.length} pairs fail WCAG AA`,
            hint: examples
        });
    }
    else {
        violations.push({
            id: 'contrast-ok',
            severity: 'pass',
            message: 'Contrast: all checked pairs pass WCAG AA'
        });
    }
    // ─── 5. CSS Variables coverage ───────────────────────────────────────────────
    const coverage = data.cssVarCoverage;
    if (coverage < 20) {
        violations.push({
            id: 'css-vars-low',
            severity: 'warn',
            message: `CSS variables: only ${coverage}% of colors use var()`,
            hint: 'More hardcoded values make theming and maintenance harder'
        });
    }
    else {
        violations.push({
            id: 'css-vars-ok',
            severity: 'pass',
            message: `CSS variables coverage: ${coverage}%`
        });
    }
    return violations;
}
