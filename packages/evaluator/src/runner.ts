import { chromium, type Browser, type BrowserContext } from 'playwright';
import type { TaskManifest } from '@caseprac/shared';
import { validateSubmissionUrl } from './ssrf';
import { compareScreenshots } from './visual';
import { runAccessibilityScan } from './accessibility';

export interface EvaluatedArtifact {
  artifactType: 'screenshot_actual' | 'screenshot_diff' | 'screenshot_reference';
  viewport: string;
  buffer: Buffer;
  mimeType: string;
}

export interface EvaluatedTestResult {
  category: 'functional' | 'visual' | 'accessibility';
  testName: string;
  passed: boolean;
  score: number;
  message?: string;
  detailsJson?: Record<string, any>;
  durationMs: number;
}

export interface EvaluationJobOutput {
  status: 'completed' | 'failed' | 'timed_out' | 'infrastructure_error';
  functionalScore: number;
  visualScore: number;
  accessibilityScore: number;
  totalScore: number;
  passed: boolean;
  errorMessage?: string;
  testResults: EvaluatedTestResult[];
  artifacts: EvaluatedArtifact[];
}

export async function evaluateSubmission(
  deploymentUrl: string,
  manifest: TaskManifest,
  referenceScreenshots?: Record<string, Buffer>
): Promise<EvaluationJobOutput> {
  const startTime = Date.now();
  const testResults: EvaluatedTestResult[] = [];
  const artifacts: EvaluatedArtifact[] = [];

  // 1. SSRF URL Check
  try {
    await validateSubmissionUrl(deploymentUrl);
  } catch (err: any) {
    return {
      status: 'failed',
      functionalScore: 0,
      visualScore: 0,
      accessibilityScore: 0,
      totalScore: 0,
      passed: false,
      errorMessage: err.message || 'URL security check failed',
      testResults: [
        {
          category: 'functional',
          testName: 'SSRF & URL Security Check',
          passed: false,
          score: 0,
          message: err.message,
          durationMs: Date.now() - startTime,
        },
      ],
      artifacts: [],
    };
  }

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    let totalFunctionalPassed = 0;
    let totalFunctionalTests = 0;
    let accessibilityScores: number[] = [];
    let visualScores: number[] = [];

    const viewports = manifest.viewports || [{ id: 'desktop', width: 1440, height: 900 }];

    for (const vp of viewports) {
      context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        userAgent: 'CasePrac-Evaluation-Runner/1.0',
      });

      const page = await context.newPage();
      const targetUrl = new URL(manifest.submission.startPath, deploymentUrl).toString();

      const vpStartTime = Date.now();
      let navSuccess = false;
      let navStatus = 0;

      try {
        const response = await page.goto(targetUrl, {
          timeout: manifest.evaluation?.timeoutMs || 30000,
          waitUntil: 'domcontentloaded',
        });
        navStatus = response?.status() || 0;
        navSuccess = navStatus >= 200 && navStatus < 400;
      } catch (navErr: any) {
        navSuccess = false;
      }

      totalFunctionalTests++;
      if (navSuccess) totalFunctionalPassed++;

      testResults.push({
        category: 'functional',
        testName: `Initial Page Load (${vp.id} - ${vp.width}x${vp.height})`,
        passed: navSuccess,
        score: navSuccess ? 100 : 0,
        message: navSuccess ? `HTTP ${navStatus} OK` : `Failed to load ${targetUrl}`,
        durationMs: Date.now() - vpStartTime,
      });

      if (navSuccess) {
        // Test required routes
        for (const route of manifest.submission.requiredRoutes) {
          const routeUrl = new URL(route, deploymentUrl).toString();
          const routeStartTime = Date.now();
          let routePassed = false;
          try {
            const routeResp = await page.goto(routeUrl, { timeout: 15000, waitUntil: 'domcontentloaded' });
            routePassed = (routeResp?.status() || 0) < 400;
          } catch {
            routePassed = false;
          }

          totalFunctionalTests++;
          if (routePassed) totalFunctionalPassed++;

          testResults.push({
            category: 'functional',
            testName: `Route Verification (${route} on ${vp.id})`,
            passed: routePassed,
            score: routePassed ? 100 : 0,
            message: routePassed ? `Route accessible` : `Route failed to load`,
            durationMs: Date.now() - routeStartTime,
          });
        }

        // Take actual screenshot
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        artifacts.push({
          artifactType: 'screenshot_actual',
          viewport: vp.id,
          buffer: screenshotBuffer,
          mimeType: 'image/png',
        });

        // Visual comparison if reference exists
        const refBuffer = referenceScreenshots?.[vp.id];
        if (refBuffer) {
          const comp = compareScreenshots(screenshotBuffer, refBuffer, {
            maxDiffPixelRatio: manifest.evaluation?.visual?.maxDiffPixelRatio,
            threshold: manifest.evaluation?.visual?.threshold,
          });
          visualScores.push(comp.score);

          testResults.push({
            category: 'visual',
            testName: `Visual Regression Match (${vp.id})`,
            passed: comp.passed,
            score: comp.score,
            message: `Diff pixel ratio: ${(comp.diffPixelRatio * 100).toFixed(2)}%`,
            durationMs: Date.now() - vpStartTime,
          });

          if (comp.diffPngBuffer) {
            artifacts.push({
              artifactType: 'screenshot_diff',
              viewport: vp.id,
              buffer: comp.diffPngBuffer,
              mimeType: 'image/png',
            });
          }
        } else {
          // Default visual score if no reference image provided
          visualScores.push(100);
        }

        // Accessibility scan
        if (manifest.evaluation?.accessibility?.enabled !== false) {
          const a11y = await runAccessibilityScan(page, manifest.evaluation?.accessibility?.maxViolations);
          accessibilityScores.push(a11y.score);

          testResults.push({
            category: 'accessibility',
            testName: `Accessibility & ARIA Audit (${vp.id})`,
            passed: a11y.passed,
            score: a11y.score,
            message: `${a11y.violationsCount} accessibility violation(s) found`,
            detailsJson: { violations: a11y.violations },
            durationMs: Date.now() - vpStartTime,
          });
        }
      }

      await context.close();
    }

    const functionalScore = totalFunctionalTests > 0 ? Math.round((totalFunctionalPassed / totalFunctionalTests) * 100) : 0;
    const visualScore = visualScores.length > 0 ? Math.round(visualScores.reduce((a, b) => a + b, 0) / visualScores.length) : 100;
    const accessibilityScore = accessibilityScores.length > 0 ? Math.round(accessibilityScores.reduce((a, b) => a + b, 0) / accessibilityScores.length) : 100;

    const weights = manifest.scoring || { visualWeight: 50, functionalWeight: 40, accessibilityWeight: 10 };
    const totalWeight = weights.visualWeight + weights.functionalWeight + weights.accessibilityWeight;
    
    const totalScore = Math.round(
      (functionalScore * weights.functionalWeight +
        visualScore * weights.visualWeight +
        accessibilityScore * weights.accessibilityWeight) /
        totalWeight
    );

    // Rule: Must pass all functional tests to pass challenge
    const passed = functionalScore === 100 && totalScore >= 70;

    return {
      status: 'completed',
      functionalScore,
      visualScore,
      accessibilityScore,
      totalScore,
      passed,
      testResults,
      artifacts,
    };
  } catch (err: any) {
    return {
      status: 'infrastructure_error',
      functionalScore: 0,
      visualScore: 0,
      accessibilityScore: 0,
      totalScore: 0,
      passed: false,
      errorMessage: err.message || 'Evaluation error',
      testResults: [
        {
          category: 'functional',
          testName: 'Execution Engine Error',
          passed: false,
          score: 0,
          message: err.message,
          durationMs: Date.now() - startTime,
        },
      ],
      artifacts,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
