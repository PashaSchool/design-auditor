import chalk, { ChalkInstance } from 'chalk'
import { ModuleReport, Violation, Severity } from '@/types.js'
import { AuditScore, ModuleScore } from '@utils/score.js'

const W = 64  // total visual width

// ─── Color utils ──────────────────────────────────────────────────────────────

function scoreColor(score: number): ChalkInstance {
  if (score >= 90) return chalk.green
  if (score >= 75) return chalk.greenBright
  if (score >= 60) return chalk.yellow
  if (score >= 40) return chalk.hex('#f97316')
  return chalk.red
}

function progressBar(score: number, width = 20): string {
  const filled = Math.round(score / 100 * width)
  const empty  = width - filled
  return scoreColor(score)('█'.repeat(filled)) + chalk.dim('░'.repeat(empty))
}

// ─── Hex color swatches ───────────────────────────────────────────────────────

const HEX_REGEX = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g

function colorizeHexes(text: string): string {
  return text.replace(HEX_REGEX, (hex) => {
    try { return `${chalk.bgHex(hex)('  ')} ${chalk.hex(hex)(hex)}` }
    catch { return hex }
  })
}

// ─── Violation item ───────────────────────────────────────────────────────────

const ICON: Record<Severity, string> = {
  error: chalk.bold.red('✖'),
  warn:  chalk.yellow('◆'),
  pass:  chalk.green('✔'),
}

function printViolation(v: Violation) {
  if (v.severity === 'pass') {
    console.log(`    ${ICON.pass}  ${chalk.dim(colorizeHexes(v.message))}`)
    if (v.hint) console.log(`       ${chalk.dim(colorizeHexes(v.hint))}`)
    return
  }

  const color = v.severity === 'error' ? chalk.red : chalk.yellow
  console.log(`    ${ICON[v.severity]}  ${color(colorizeHexes(v.message))}`)
  if (v.hint) console.log(`       ${chalk.dim(colorizeHexes(v.hint))}`)
}

// ─── Module header ────────────────────────────────────────────────────────────
// Layout: ── NAME ──────────────────────── ████████░░░░  38 ──

const BAR_W  = 12   // visual width of inline bar
const RIGHT_W = 1 + BAR_W + 2 + 3 + 3  // " bar  score ──" = 21

function moduleHeader(name: string, ms?: ModuleScore) {
  const leftStr   = `── ${name.toUpperCase()} `
  const dashCount = Math.max(2, W - leftStr.length - (ms ? RIGHT_W : 3))

  const right = ms
    ? ` ${progressBar(ms.score, BAR_W)}  ${scoreColor(ms.score)(String(ms.score).padStart(3))} ──`
    : ' ──'

  console.log(
    chalk.dim('── ') +
    chalk.bold.white(name.toUpperCase() + ' ') +
    chalk.dim('─'.repeat(dashCount)) +
    right
  )
}

// ─── Dividers ─────────────────────────────────────────────────────────────────

function line()  { console.log(chalk.dim('─'.repeat(W))) }
function thick() { console.log(chalk.dim('━'.repeat(W))) }

// ─── Header (URL banner) ──────────────────────────────────────────────────────

export function printHeader(url: string) {
  const host = url.replace(/https?:\/\//, '').replace(/\/$/, '')
  const left = '  DESIGN AUDITOR'
  const right = chalk.dim(host)
  const gap = Math.max(2, W - left.length - host.length - 2)

  console.log()
  thick()
  console.log(chalk.bold.white(left) + ' '.repeat(gap) + right)
  thick()
  console.log()
}

// ─── Module report ────────────────────────────────────────────────────────────

export function printReport(reports: ModuleReport[], auditScore?: AuditScore) {
  const scoreMap = new Map(auditScore?.modules.map(m => [m.name, m]))

  let totalError = 0
  let totalWarn  = 0
  let totalPass  = 0

  for (const report of reports) {
    const ms = scoreMap.get(report.name)

    // sort: errors → warnings → passes
    const sorted = [
      ...report.violations.filter(v => v.severity === 'error'),
      ...report.violations.filter(v => v.severity === 'warn'),
      ...report.violations.filter(v => v.severity === 'pass'),
    ]

    for (const v of sorted) {
      if (v.severity === 'error') totalError++
      if (v.severity === 'warn')  totalWarn++
      if (v.severity === 'pass')  totalPass++
    }

    moduleHeader(report.name, ms)
    console.log()
    sorted.forEach(printViolation)
    console.log()
  }

  // Summary bar
  thick()
  const errStr  = totalError > 0 ? chalk.bold.red(`  ${totalError} errors`) : chalk.dim(`  ${totalError} errors`)
  const warnStr = totalWarn  > 0 ? chalk.yellow(`  ${totalWarn} warnings`) : chalk.dim(`  ${totalWarn} warnings`)
  const passStr = chalk.green(`  ${totalPass} passed`)
  console.log(errStr + warnStr + passStr)
  thick()
}

// ─── Score panel ──────────────────────────────────────────────────────────────

export function printScore(auditScore: AuditScore) {
  const { overall, grade, label, modules } = auditScore

  console.log()
  console.log(chalk.bold.white('  SCORE BREAKDOWN'))
  console.log()

  const nameW = Math.max(...modules.map(m => m.name.length))

  for (const m of modules) {
    const name    = chalk.dim(m.name.padEnd(nameW + 1))
    const bar     = progressBar(m.score, 18)
    const score   = scoreColor(m.score)(String(m.score).padStart(3))
    const errors  = m.error > 0 ? chalk.red(`${m.error}✖`) : chalk.dim(`${m.error}✖`)
    const warns   = m.warn  > 0 ? chalk.yellow(`${m.warn}◆`) : chalk.dim(`${m.warn}◆`)
    const passes  = chalk.dim(`${m.pass}✔`)
    console.log(`  ${name}  ${bar}  ${score}   ${errors}  ${warns}  ${passes}`)
  }

  console.log()
  line()
  console.log()

  // Overall score block
  const overallBar   = progressBar(overall, 38)
  const overallScore = scoreColor(overall).bold(String(overall))
  const gradeStr     = scoreColor(overall).bold(grade)
  const labelStr     = scoreColor(overall)(label)

  console.log(`  ${overallBar}`)
  console.log()
  console.log(
    `  ${chalk.bold('Overall')}  ` +
    overallScore + chalk.dim('/100') +
    `    ${chalk.bold('Grade')}  ` + gradeStr +
    `  ${chalk.dim('·')}  ` + labelStr
  )
  console.log()
  thick()
  console.log()
}
