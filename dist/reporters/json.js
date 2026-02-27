import { writeFileSync } from 'fs';
import { calculateScore } from '../utils/score.js';
export function buildJsonReport(url, reports) {
    const summary = { pass: 0, warn: 0, error: 0 };
    for (const module of reports) {
        for (const v of module.violations) {
            summary[v.severity]++;
        }
    }
    return {
        url,
        date: new Date().toISOString(),
        score: calculateScore(reports),
        summary,
        modules: reports,
    };
}
export function saveReport(report) {
    const host = new URL(report.url).hostname.replace(/\./g, '-');
    const date = new Date().toISOString().slice(0, 10);
    const filename = `design-audit-${host}-${date}.json`;
    writeFileSync(filename, JSON.stringify(report, null, 2), 'utf-8');
    return filename;
}
