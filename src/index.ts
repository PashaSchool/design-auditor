#!/usr/bin/env node
import { Command } from 'commander'
import { chromium } from 'playwright'
import ora from 'ora'
import { extractTypography }           from '@extractors/typography.js'
import { extractRhythm }               from '@extractors/rhythm.js'
import { extractColors }               from '@extractors/colors.js'
import { extractComponents }           from '@extractors/components.js'
import { extractReadingWidth }         from '@extractors/reading-width.js'
import { extractImages }               from '@extractors/images.js'
import { extractLinks }                from '@extractors/links.js'
import { extractBreakpoints }          from '@extractors/breakpoints.js'
import { extractHeadings }             from '@extractors/headings.js'
import { checkTypography }             from '@rules/typography.rules.js'
import { checkRhythm }                 from '@rules/rhythm.rules.js'
import { checkColors }                 from '@rules/colors.rules.js'
import { checkComponents }             from '@rules/components.rules.js'
import { checkReadingWidth }           from '@rules/reading-width.rules.js'
import { checkImages }                 from '@rules/images.rules.js'
import { checkLinks }                  from '@rules/links.rules.js'
import { checkBreakpoints }            from '@rules/breakpoints.rules.js'
import { checkHeadings }               from '@rules/headings.rules.js'
import { printReport, printScore }     from '@reporters/terminal.js'
import { buildJsonReport, saveReport } from '@reporters/json.js'
import { calculateScore }              from '@utils/score.js'
import { ModuleReport }                from '@/types.js'

const program = new Command()

program
  .name('design-auditor')
  .description('Audit design consistency of any website')
  .version('0.1.0')
  .argument('<url>', 'URL to audit')
  .option('--only <modules>', 'Run only specific modules: typography,colors,spacing')
  .option('--save-report', 'Save report as JSON file')
  .option('--local', 'Optimize for local dev servers (localhost)')
  .action(async (url: string, options) => {
    const isLocal = options.local || url.includes('localhost') || url.includes('127.0.0.1')
    const spinner = ora(`Analyzing ${url}`).start()

    let browser
    try {
      browser = await chromium.launch()
      const context = await browser.newContext({
        ignoreHTTPSErrors: isLocal,
      })
      const page = await context.newPage()

      await page.goto(url, {
        waitUntil: isLocal ? 'load' : 'networkidle',
        timeout: isLocal ? 15000 : 30000,
      })

      if (isLocal) await page.waitForTimeout(1000)

      spinner.text = 'Extracting typography...'
      const typographyData = await extractTypography(page)

      spinner.text = 'Extracting rhythm & spacing...'
      const rhythmData = await extractRhythm(page)

      spinner.text = 'Extracting colors...'
      const colorsData = await extractColors(page)

      spinner.text = 'Extracting components...'
      const componentsData = await extractComponents(page)

      spinner.text = 'Extracting reading width...'
      const readingWidthData = await extractReadingWidth(page)

      spinner.text = 'Extracting images...'
      const imagesData = await extractImages(page)

      spinner.text = 'Extracting links...'
      const linksData = await extractLinks(page)

      spinner.text = 'Extracting breakpoints...'
      const breakpointsData = await extractBreakpoints(page)

      spinner.text = 'Extracting headings...'
      const headingsData = await extractHeadings(page)

      spinner.succeed('Done')

      const reports: ModuleReport[] = [
        { name: 'Typography',                violations: checkTypography(typographyData) },
        { name: 'Vertical Rhythm & Spacing', violations: checkRhythm(rhythmData) },
        { name: 'Colors',                    violations: checkColors(colorsData) },
        { name: 'Components',                violations: checkComponents(componentsData) },
        { name: 'Reading Width',             violations: checkReadingWidth(readingWidthData) },
        { name: 'Images',                    violations: checkImages(imagesData) },
        { name: 'Links',                     violations: checkLinks(linksData) },
        { name: 'Breakpoints',               violations: checkBreakpoints(breakpointsData) },
        { name: 'Headings',                  violations: checkHeadings(headingsData) },
      ]

      printReport(reports)
      printScore(calculateScore(reports))

      if (options.saveReport) {
        const report   = buildJsonReport(url, reports)
        const filename = saveReport(report)
        console.log(`\nReport saved → ${filename}`)
      }

    } catch (err) {
      spinner.fail('Failed')
      console.error(err)
    } finally {
      await browser?.close()
    }
  })

program.parse()
