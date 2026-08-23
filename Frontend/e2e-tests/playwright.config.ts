import { defineConfig, devices } from '@playwright/test';
import type { MockOptions } from './tests/fixtures';

/**
 * Playwright configuration for the mock-backend suite.
 *
 * Separate from `../playwright.config.ts` on purpose: that one targets a real edu-sharing instance
 * (its `globalSetup` logs in against a live backend) and records trace/video/screenshots for every
 * test, which is the wrong trade-off for pixel comparisons.
 *
 * Everything here is geared towards reproducibility — same viewport, same locale, same time zone,
 * no animations — so that `toHaveScreenshot` diffs mean "the UI changed", not "the machine differs".
 */

const isCi = !!process.env.CI;

/** Same rendering on every machine: fixed colour profile, no font hinting. */
const chromiumLaunchOptions = {
    args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
};

const desktop = {
    ...devices['Desktop Chrome'],
    // After the device spread, otherwise its 1280x720 wins.
    viewport: { width: 1280, height: 800 },
    launchOptions: chromiumLaunchOptions,
};

/**
 * Portrait phone: below `$mobileTabSwitchWidth` (900px) the layout switches to the mobile
 * navigation, which the desktop baselines never cover.
 */
const mobile = {
    ...devices['Pixel 5'],
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 1,
    launchOptions: chromiumLaunchOptions,
};

/**
 * `theme` reaches the application through the `?theme=` query parameter; `colorScheme` makes the
 * browser's `prefers-color-scheme` agree with it, so media queries match the applied theme.
 */
const light = { theme: 'light' as const, colorScheme: 'light' as const };
const dark = { theme: 'dark' as const, colorScheme: 'dark' as const };

const config = defineConfig<MockOptions>({
    // Compiled output of `tests/` (see `npm run pree2e:mock`).
    testDir: './build/tests/scenarios',
    outputDir: './test-results',
    // Resolved relative to this file, i.e. baselines live in the sources and are committed.
    snapshotPathTemplate: './__screenshots__/{projectName}/{testFileName}/{arg}{ext}',
    timeout: 60_000,
    expect: {
        timeout: 15_000,
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            scale: 'css',
            stylePath: './tests/screenshot.css',
            maxDiffPixelRatio: 0.002,
        },
    },
    // The scenarios share nothing: every test logs in itself, and the mock backend keeps its state
    // per session cookie, i.e. per browser context. So they can all run at the same time.
    fullyParallel: true,
    // One worker per core, capped - beyond that the workers mostly wait for each other's CPU.
    workers: isCi ? '100%' : '50%',
    // Retries would mask flakiness; a mock backend removes the usual reasons for it.
    retries: 0,
    forbidOnly: isCi,
    reporter: [
        ['list'],
        ['html', { outputFolder: './report', open: 'never' }],
        ['junit', { outputFile: './report/junit.xml' }],
    ],
    use: {
        baseURL: 'http://127.0.0.1:4200/edu-sharing/',
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
        // `reducedMotion` is only available as a context option.
        contextOptions: { reducedMotion: 'reduce' },
        locale: 'de-DE',
        timezoneId: 'UTC',
        trace: 'retain-on-failure',
        video: 'off',
        screenshot: 'only-on-failure',
    },
    // Four projects, i.e. four baselines per screenshot: desktop and portrait phone, each in light
    // and dark mode. `snapshotPathTemplate` keeps them apart by project name.
    projects: [
        {
            name: 'chromium',
            use: { ...desktop, ...light },
        },
        // The dialog suite runs on desktop light only: on a phone nearly every dialog is full
        // screen, and one baseline per dialog keeps the run fast.
        {
            name: 'chromium-dark',
            testIgnore: [
                '**/dialogs.spec.js',
                '**/editorial-sidebar.spec.js',
                '**/rs2-modules.spec.js',
            ],
            use: { ...desktop, ...dark },
        },
        {
            name: 'mobile',
            testIgnore: [
                '**/dialogs.spec.js',
                '**/editorial-sidebar.spec.js',
                '**/rs2-modules.spec.js',
            ],
            use: { ...mobile, ...light },
        },
        {
            name: 'mobile-dark',
            testIgnore: [
                '**/dialogs.spec.js',
                '**/editorial-sidebar.spec.js',
                '**/rs2-modules.spec.js',
            ],
            use: { ...mobile, ...dark },
        },
    ],
    webServer: {
        // `cwd` of a webServer command is the directory of this config file.
        command: 'node build/mock-backend/index.js',
        url: 'http://127.0.0.1:4200/edu-sharing/index.html',
        reuseExistingServer: !isCi,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});

export default config;
