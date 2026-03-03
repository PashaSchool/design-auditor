import { ModuleReport } from '@/types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModuleScore {
  name: string;
  score: number; // 0–100
  weight: number; // module weight in the final score (%)
  pass: number;
  warn: number;
  error: number;
}

export interface AuditScore {
  overall: number; // 0–100
  grade: string; // A / B / C / D / F
  label: string; // Excellent / Good / Needs Work / Poor / Critical
  color: string; // hex for display
  modules: ModuleScore[];
}

// ─── Module weights ───────────────────────────────────────────────────────────
// Sum = 100. Colors and components weigh more — they are most visible.

const MODULE_WEIGHTS: Record<string, number> = {
  typography: 15,
  'vertical rhythm & spacing': 15,
  colors: 20,
  components: 15,
  'reading width': 10,
  images: 10,
  links: 5,
  breakpoints: 5,
  headings: 5,
};

// ─── Severity weights ─────────────────────────────────────────────────────────
// pass  = full points
// warn  = half points (issue but not critical)
// error = zero points

const SEVERITY_SCORE: Record<string, number> = {
  pass: 1.0,
  warn: 0.5,
  error: 0.0,
};

// ─── Grade table ──────────────────────────────────────────────────────────────

function getGrade(score: number): {
  grade: string;
  label: string;
  color: string;
} {
  if (score >= 90) return { grade: 'A', label: 'Excellent', color: '#22c55e' };
  if (score >= 75) return { grade: 'B', label: 'Good', color: '#84cc16' };
  if (score >= 60) return { grade: 'C', label: 'Needs Work', color: '#f59e0b' };
  if (score >= 40) return { grade: 'D', label: 'Poor', color: '#f97316' };
  return { grade: 'F', label: 'Critical', color: '#ef4444' };
}

// ─── Main function ────────────────────────────────────────────────────────────

export function calculateScore(reports: ModuleReport[]): AuditScore {
  const moduleScores: ModuleScore[] = [];

  for (const report of reports) {
    const key = report.name.toLowerCase();
    const weight = MODULE_WEIGHTS[key] ?? Math.round(100 / reports.length);

    const pass = report.violations.filter((v) => v.severity === 'pass').length;
    const warn = report.violations.filter((v) => v.severity === 'warn').length;
    const error = report.violations.filter(
      (v) => v.severity === 'error'
    ).length;
    const total = pass + warn + error;

    // weighted sum / max possible sum → percentage
    const rawScore =
      total > 0
        ? ((pass * SEVERITY_SCORE.pass +
            warn * SEVERITY_SCORE.warn +
            error * SEVERITY_SCORE.error) /
            (total * SEVERITY_SCORE.pass)) *
          100
        : 100;

    moduleScores.push({
      name: report.name,
      score: Math.round(rawScore),
      weight,
      pass,
      warn,
      error,
    });
  }

  // weighted average across modules
  const totalWeight = moduleScores.reduce((s, m) => s + m.weight, 0);
  const weightedSum = moduleScores.reduce((s, m) => s + m.score * m.weight, 0);
  const overall = Math.round(weightedSum / totalWeight);

  const { grade, label, color } = getGrade(overall);

  return { overall, grade, label, color, modules: moduleScores };
}
