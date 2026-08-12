import { expect, Locator, Page, test as base } from '@playwright/test';
import * as fs from 'fs';

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
}

/**
 * The test object used by every mock scenario.
 *
 * It applies everything that has to be in place *before* the first navigation:
 * - a fixed clock, so relative dates ("vor 2 Tagen") never change,
 * - a seeded `Math.random`, so anything id- or shuffle-based is stable,
 * - dismissed tutorials, so no overlay covers the page,
 * - guards that turn unmocked endpoints (HTTP 501) and console errors into test failures.
 */
export const test = base.extend<MockFixtures>({
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

        // Time is frozen via `setFixedTime` rather than `clock.install()`: installing fake timers
        // stalls zone.js-driven change detection and the app never finishes loading.
        await page.clock.setFixedTime(new Date('2024-01-01T12:00:00Z'));
        await page.addInitScript(() => {
            let seed = 42;
            Math.random = () => {
                seed = (seed * 1664525 + 1013904223) % 4294967296;
                return seed / 4294967296;
            };
            window.localStorage.setItem('TUTORIAL.USER_TUTORIAL_HEADING', 'true');
            window.localStorage.setItem('TUTORIAL.SEARCH.TUTORIAL_HEADING', 'true');
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

/** Waits until the page is visually settled: no spinner, no pending request, fonts loaded. */
export async function settle(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.mat-mdc-progress-bar, es-spinner')).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    // One more frame so Material has finished its layout pass.
    await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
}

/**
 * Compares a screenshot against the committed baseline.
 *
 * When no baseline exists yet the comparison is skipped with a warning instead of failing, so a
 * new scenario can be merged before its baseline is generated (see `tests-mock/README.md`).
 * Set `E2E_MOCK_REQUIRE_BASELINES=1` to make a missing baseline a hard error.
 */
export async function expectScreenshot(
    target: Page | Locator,
    name: string,
    options: Parameters<Locator['screenshot']>[0] & { mask?: Locator[] } = {},
): Promise<void> {
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
    await expect(target).toHaveScreenshot(name, options);
}
