import chalk from 'chalk'
import { ModuleReport, Violation, Severity } from '@/types.js'
import { AuditScore } from '@utils/score.js'

// ─── Violation rendering ──────────────────────────────────────────────────────

const icon: Record<Severity, string> = {
  pass:  chalk.green('✅'),
  warn:  chalk.yellow('⚠️ '),
  error: chalk.red('❌'),
}

const label: Record<Severity, (s: string) => string> = {
  pass:  chalk.green,
  warn:  chalk.yellow,
  error: chalk.red,
}

const HEX_REGEX = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g

function colorizeHexes(text: string): string {
  return text.replace(HEX_REGEX, (hex) => {
    try {
      return `${chalk.bgHex(hex)('  ')} ${chalk.hex(hex)(hex)}`
    } catch {
      return hex
    }
  })
}

function printViolation(v: Violation) {
  console.log(`  ${icon[v.severity]} ${label[v.severity](colorizeHexes(v.message))}`)
  if (v.hint) {
    console.log(`     ${chalk.dim(colorizeHexes(v.hint))}`)
  }
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function progressBar(score: number, width = 24): string {
  const filled = Math.round(score / 100 * width)
  const empty  = width - filled

  // bar color depends on score
  const barColor =
    score >= 90 ? chalk.green :
    score >= 75 ? chalk.greenBright :
    score >= 60 ? chalk.yellow :
    score >= 40 ? chalk.yellowBright :
    chalk.red

  return barColor('█'.repeat(filled)) + chalk.dim('░'.repeat(empty))
}

function scoreColor(score: number): chalk.Chalk {
  if (score >= 90) return chalk.green
  if (score >= 75) return chalk.greenBright
  if (score >= 60) return chalk.yellow
  if (score >= 40) return chalk.yellowBright
  return chalk.red
}

// ─── Dividers ─────────────────────────────────────────────────────────────────

function divider() {
  console.log(chalk.dim('─'.repeat(60)))
}

function thickDivider() {
  console.log(chalk.dim('━'.repeat(60)))
}

// ─── Main exports ─────────────────────────────────────────────────────────────

export function printReport(reports: ModuleReport[]) {
  console.log()
  divider()

  let totalPass = 0
  let totalWarn = 0
  let totalError = 0

  for (const report of reports) {
    console.log(chalk.bold.white(`  ${report.name.toUpperCase()}`))
    divider()

    for (const v of report.violations) {
      printViolation(v)
      if (v.severity === 'pass')  totalPass++
      if (v.severity === 'warn')  totalWarn++
      if (v.severity === 'error') totalError++
    }

    console.log()
  }

  divider()
  console.log(
    chalk.bold('  Violations:  ') +
    chalk.red(`${totalError} ❌`) + '  ' +
    chalk.yellow(`${totalWarn} ⚠️ `) + '  ' +
    chalk.green(`${totalPass} ✅`)
  )
}

export function printScore(auditScore: AuditScore) {
  const { overall, grade, label, modules } = auditScore

  console.log()
  thickDivider()
  console.log(chalk.bold.white('  DESIGN SYSTEM SCORE'))
  thickDivider()
  console.log()

  // Module scores
  const nameWidth = Math.max(...modules.map(m => m.name.length))

  for (const m of modules) {
    const name    = m.name.padEnd(nameWidth + 2)
    const bar     = progressBar(m.score)
    const score   = scoreColor(m.score)(String(m.score).padStart(3))
    const details = chalk.dim(`(${m.pass}✓ ${m.warn}⚠ ${m.error}✗)`)
    console.log(`  ${chalk.dim(name)}  ${bar}  ${score}  ${details}`)
  }

  console.log()
  divider()
  console.log()

  // Overall score — big and prominent
  const overallBar   = progressBar(overall, 36)
  const overallScore = scoreColor(overall).bold(`${overall}`)
  const gradeStr     = scoreColor(overall).bold(`${grade}`)
  const labelStr     = scoreColor(overall)(label)

  console.log(`  ${overallBar}`)
  console.log()
  console.log(
    `  Overall Score: ${overallScore} / 100    ` +
    `Grade: ${gradeStr}  ${chalk.dim('—')}  ${labelStr}`
  )
  console.log()
  thickDivider()
  console.log()
}
