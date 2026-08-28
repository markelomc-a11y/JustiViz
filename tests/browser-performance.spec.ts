import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type FrameSample = {
  elapsedMs: number;
  frameCount: number;
  fps: number;
};

test('measures browser FPS while scrolling a preloaded case study', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#case-study-select').selectOption('pt-eurlex-001');
  await expect(page.locator('#scrollytelling-view')).toBeVisible();

  await page.evaluate(() => {
    (window as Window & { __fpsSamples?: FrameSample[] }).__fpsSamples = [];
    const start = performance.now();
    let frameCount = 0;
    let lastSample = start;

    const sample = (now: number) => {
      frameCount += 1;
      if (now - lastSample >= 1000) {
        const elapsedMs = now - lastSample;
        (window as Window & { __fpsSamples?: FrameSample[] }).__fpsSamples?.push({
          elapsedMs,
          frameCount,
          fps: frameCount / (elapsedMs / 1000),
        });
        frameCount = 0;
        lastSample = now;
      }
      requestAnimationFrame(sample);
    };

    requestAnimationFrame(sample);
  });

  const scrollSteps = 60;
  const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewportHeight = page.viewportSize()?.height ?? 720;
  for (let step = 0; step < scrollSteps; step += 1) {
    const targetY = (documentHeight - viewportHeight) * (step / (scrollSteps - 1));
    await page.evaluate((scrollY) => window.scrollTo({ top: scrollY, behavior: 'smooth' }), targetY);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1_500);

  const samples = await page.evaluate(() =>
    (window as Window & { __fpsSamples?: FrameSample[] }).__fpsSamples || []
  );
  expect(samples.length).toBeGreaterThan(0);

  const fpsValues = samples.map((sample) => sample.fps);
  const report = {
    measured_at: new Date().toISOString(),
    browser: await page.evaluate(() => navigator.userAgent),
    viewport: page.viewportSize(),
    trace_id: 'pt-eurlex-001',
    trace_step_count: 5,
    scroll_steps: scrollSteps,
    duration_ms: samples.reduce((total, sample) => total + sample.elapsedMs, 0),
    fps: {
      min: Math.min(...fpsValues),
      average: fpsValues.reduce((total, fps) => total + fps, 0) / fpsValues.length,
      max: Math.max(...fpsValues),
    },
    samples,
  };

  await fs.mkdir(path.resolve('test-results'), { recursive: true });
  await fs.writeFile(
    path.resolve('test-results/performance-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
});
