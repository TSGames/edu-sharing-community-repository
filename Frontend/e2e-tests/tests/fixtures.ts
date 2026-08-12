import { expect, Locator, Page, test as base } from '@playwright/test';
import * as fs from 'fs';
import { AppPage } from './pages/app.page';

/** Requests that are allowed to fail without failing the test. */
const IGNORED_CONSOLE_MESSAGES = [
    'Angular is running in development mode',
    'mds does not define columns',
    'mds does not define sort info',
    'Failed to load resource: net::ERR_ABORTED',
];

export interface MockFixtures {
    /** Messages the page logged to `console.error` (minus the allowlist). */
    consoleErrors: string[];
    /** Page helper, pre-configured with the project's theme. */
    app: AppPage;
}

export interface MockOptions {
    /**
     * Colour theme of the project. Handed to the application as `?theme=...`, which takes priority
     * over the stored accessibility setting (see `ThemeService.registerDarkMode`).
     */
    theme: 'light' | 'dark';
}

/**
 * The test object used by every mock scenario.
 *
 * It applies everything that has to be in place *before* the first navigation:
 * - a seeded `Math.random`, so anything id- or shuffle-based is stable,
 * - dismissed tutorials, so no overlay covers the page,
 * - guards that turn unmocked endpoints (HTTP 501) and console errors into test failures.
 */
export const test = base.extend<MockOptions & MockFixtures>({
    theme: ['light', { option: true }],

    app: async ({ page, theme }, use) => {
        await use(new AppPage(page, theme));
    },

    consoleErrors: async ({ page }, use) => {
        const errors: string[] = [];
        const unmocked: string[] = [];

        page.on('console', (message) => {
            if (message.type() !== 'error') {
                return;
            }
            const text = message.text();
            if (!IGNORED_CONSOLE_MESSAGES.some((ignored) => text.includes(ignored))) {
                errors.push(text);
            }
        });
        page.on('pageerror', (error) => errors.push(`Uncaught: ${error.message}`));
        page.on('response', (response) => {
            if (response.status() === 501) {
                unmocked.push(`${response.request().method()} ${new URL(response.url()).pathname}`);
            }
        });

        // No `page.clock` here - neither `install()` nor `setFixedTime()` work with this app:
        // it measures elapsed time via `Date.now()` differences, so a frozen clock leaves the
        // loading screen up forever. Determinism of dates comes from the fixed timestamps in the
        // mock fixtures instead; anything that renders a *relative* date must be masked.
        await page.addInitScript(() => {
            let seed = 42;
            Math.random = () => {
                seed = (seed * 1664525 + 1013904223) % 4294967296;
                return seed / 4294967296;
            };
            window.localStorage.setItem('TUTORIAL.USER_TUTORIAL_HEADING', 'true');
            window.localStorage.setItem('TUTORIAL.SEARCH.TUTORIAL_HEADING', 'true');
            // Language "none" from the very first paint. The `locale=none` query parameter alone
            // is applied only after the first render, so a cold load would briefly show the
            // default language - and that race made screenshots differ between runs.
            // `SessionStorageService` reads this key from localStorage for guests.
            window.localStorage.setItem('language', JSON.stringify('none'));
        });
        // Nothing outside the mock may influence the rendering.
        await page.route('**', async (route) => {
            const host = new URL(route.request().url()).hostname;
            if (host === '127.0.0.1' || host === 'localhost') {
                await route.continue();
            } else {
                await route.abort();
            }
        });

        await use(errors);

        expect(unmocked, 'requests hit endpoints the mock backend does not implement').toEqual([]);
        expect(errors, 'the page logged errors').toEqual([]);
    },
});

export { expect };

/** Animated element that must never end up in a baseline. */
export const PROGRESS_BAR = '.mat-mdc-progress-bar';

/** Waits until the page is visually settled: no spinner, no pending request, fonts loaded. */
export async function settle(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
    // Generous timeout: the very first navigation of a worker also pays for loading all lazy
    // chunks of the application bundle.
    await expect(page.locator('[data-test="loading-spinner"]')).toHaveCount(0, { timeout: 45_000 });
    // The main nav progress bar is not a reliable idle signal - it stays visible on some pages
    // even after all requests finished. It is masked in screenshots instead (see `PROGRESS_BAR`).
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    // Reset every scroll position - vertically, because node lists keep an internal scroll offset
    // that survives navigation (it shifted whole tables by one row), and horizontally, because the
    // collection carousel starts on a different card depending on how fast the page loaded.
    await page.evaluate(() => {
        window.scrollTo(0, 0);
        document.querySelectorAll('*').forEach((element) => {
            if (element.scrollTop) {
                element.scrollTop = 0;
            }
            if (element.scrollLeft) {
                element.scrollLeft = 0;
            }
        });
    });
    // One more frame so Material has finished its layout pass.
    await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
}

/**
 * Compares a screenshot against the committed baseline.
 *
 * When no baseline exists yet the comparison is skipped with a warning instead of failing, so a
 * new scenario can be merged before its baseline is generated (see `e2e-tests/README.md`).
 * Set `E2E_MOCK_REQUIRE_BASELINES=1` to make a missing baseline a hard error.
 */
export async function expectScreenshot(
    target: Page | Locator,
    name: string,
    options: Parameters<Locator['screenshot']>[0] & { mask?: Locator[] } = {},
): Promise<void> {
    const page = 'page' in target ? (target as Locator).page() : (target as Page);
    // Always masked: the progress bar of the main nav is animated, stays visible on some pages and
    // shows up as a 4px strip at the top of the content area on mobile.
    const mask = [...(options.mask ?? []), page.locator(PROGRESS_BAR)];
    const info = test.info();
    const updateMode = info.config.updateSnapshots;
    const baseline = info.snapshotPath(name);
    if (updateMode === 'none' || updateMode === 'missing') {
        if (!fs.existsSync(baseline)) {
            const message = `No baseline for "${name}" (${baseline}).`;
            if (process.env.E2E_MOCK_REQUIRE_BASELINES === '1') {
                throw new Error(`${message} Run "npm run e2e:mock:update" and commit the result.`);
            }
            console.warn(`[mock-e2e] ${message} Skipping the visual comparison.`);
            info.annotations.push({ type: 'missing-baseline', description: baseline });
            return;
        }
    }
    await expect(target).toHaveScreenshot(name, { ...options, mask });
}
