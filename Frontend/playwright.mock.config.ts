import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

/**
 * Playwright configuration for the mock-backend suite.
 *
 * Separate from `playwright.config.ts` on purpose: that one targets a real edu-sharing instance
 * (its `globalSetup` logs in against a live backend) and records trace/video/screenshots for every
 * test, which is the wrong trade-off for pixel comparisons.
 *
 * Everything here is geared towards reproducibility — same viewport, same locale, same time zone,
 * no animations — so that `toHaveScreenshot` diffs mean "the UI changed", not "the machine differs".
 */

const isCi = !!process.env.CI;

const config: PlaywrightTestConfig = {
    // Compiled output of `tests-mock` (see `npm run pree2e:mock`).
    testDir: './playwright/out-mock/tests-mock/scenarios',
    outputDir: './playwright/test-results-mock',
    // Resolved relative to this file, i.e. baselines live in the sources and are committed.
    snapshotPathTemplate: './tests-mock/__screenshots__/{projectName}/{testFileName}/{arg}{ext}',
    timeout: 60_000,
    expect: {
        timeout: 15_000,
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            scale: 'css',
            stylePath: './tests-mock/screenshot.css',
            maxDiffPixelRatio: 0.002,
        },
    },
    fullyParallel: false,
    workers: isCi ? 1 : 2,
    // Retries would mask flakiness; a mock backend removes the usual reasons for it.
    retries: 0,
    forbidOnly: isCi,
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report-mock', open: 'never' }],
        ['junit', { outputFile: 'playwright-report-mock/junit.xml' }],
    ],
    use: {
        baseURL: 'http://127.0.0.1:4200/edu-sharing/',
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
        // `reducedMotion` is only available as a context option.
        contextOptions: { reducedMotion: 'reduce' },
        locale: 'de-DE',
        timezoneId: 'UTC',
        trace: 'retain-on-failure',
        video: 'off',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
                },
            },
        },
    ],
    webServer: {
        command: 'node mock-backend/out/index.js',
        url: 'http://127.0.0.1:4200/edu-sharing/index.html',
        reuseExistingServer: !isCi,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
};

export default config;
