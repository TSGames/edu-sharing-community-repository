import { expect, expectScreenshot, LOCALE, settle, test } from '../fixtures';

/**
 * The renderer modules of **rendering service 2**, each on its own.
 *
 * Instead of driving the whole application once per module, this suite mounts the published web
 * component `<edu-sharing-render>` on a bare host page the mock serves at `/rs2-harness`. The
 * component takes the entire node base64-encoded in an attribute, so a module needs no login, no
 * workspace and no node request - only the RS2 answer, which the mock picks by node id
 * (`mock-backend/src/fixtures/rs2-modules.ts`).
 *
 * That also covers `isWebComponent: true`, which has its own branches in the dispatch
 * (`render.component.html`): PDF renders through an iframe rather than the pdf viewer, and Moodle
 * shows a preview image instead of an iframe.
 *
 * Translations are not loaded here, so the labels are raw i18n keys - the same property the
 * application baselines get from `locale=none`, and for the same reason: the baselines stay
 * independent of the wording.
 *
 * Runs in the `chromium` project only (`testIgnore` in `playwright.config.ts`).
 */

/** The fixed-size box the host page puts the component in - fully visible in the viewport. */
const FRAME = '.frame';

async function gotoModule(page: any, module: string): Promise<void> {
    // The harness honours `locale` like the application: `TranslationsService` reads it off the
    // query string. With the default `none` the component prints raw i18n keys, which is what the
    // committed baselines expect; the capture run passes a real language instead.
    await page.goto(`/rs2-harness?module=${module}&locale=${LOCALE}`);
    await expect(page.locator(`.module-${moduleClass(module)}`)).toBeVisible();
    await settle(page);
}

/** The css class the dispatch puts on its wrapper: `module module-<data.module>`. */
function moduleClass(module: string): string {
    return module.startsWith('url-') ? 'url' : module === 'default' ? 'default' : module.toUpperCase();
}

test.describe('rendering service 2 modules', () => {
    /** Backend module: one image link, the deterministic base case. */
    test('image', async ({ page }) => {
        await gotoModule(page, 'image');
        await expect(page.locator('rs-module-image img')).toBeVisible();
        await expectScreenshot(page.locator(FRAME), 'rs2-image.png');
    });

    /**
     * Backend module with two links of different height, so the component offers its resolution
     * menu on top of the player.
     */
    test('video', async ({ page }) => {
        await gotoModule(page, 'video');
        await expect(page.locator('rs-module-video video')).toBeVisible();
        await expect(page.locator('rs-module-video button[aria-label="resolution"]')).toBeVisible();
        await expectScreenshot(page.locator(FRAME), 'rs2-video.png');
    });

    test('audio', async ({ page }) => {
        await gotoModule(page, 'audio');
        await expect(page.locator('rs-module-audio video')).toBeVisible();
        await expectScreenshot(page.locator(FRAME), 'rs2-audio.png');
    });

    test('ddb', async ({ page }) => {
        await gotoModule(page, 'ddb');
        await expect(page.locator('rs-module-ddb img')).toBeVisible();
        await expectScreenshot(page.locator(FRAME), 'rs2-ddb.png');
    });

    /** The error module renders the generic heading plus `publicErrorMessage`. */
    test('error', async ({ page }) => {
        await gotoModule(page, 'error');
        await expect(page.locator('rs-module-error .rs-error-message h3')).toBeVisible();
        await expectScreenshot(page.locator(FRAME), 'rs2-error.png');
    });

    /**
     * Frontend fallback, reached because the mock answers 415 for this node: no backend module for
     * the media type, so `ModuleInfoService` classifies it - and finds nothing but `default`.
     */
    test('default (frontend fallback)', async ({ page }) => {
        await gotoModule(page, 'default');
        await expect(page.locator('rs-module-default img')).toBeVisible();
        await expectScreenshot(page.locator(FRAME), 'rs2-default.png');
    });
});

/**
 * The `url` module. Every case reaches it through the same 415 fallback and differs only in the
 * node's properties, which is what `checkUrlModule` classifies into a `UrlEmbeddings` value.
 */
test.describe('rendering service 2 url embeddings', () => {
    /**
     * YouTube and Vimeo are declared in the mock's `gdpr.entry` client config, so the module
     * renders its consent overlay rather than a third-party iframe - the state a privacy-compliant
     * deployment shows, and the only one that renders without reaching an external host.
     */
    for (const [module, name] of [
        ['url-youtube', 'youtube'],
        ['url-vimeo', 'vimeo'],
    ] as const) {
        test(`${name} shows the consent overlay`, async ({ page }) => {
            await gotoModule(page, module);
            // Asserted through the markup rather than the label: the capture run renders the
            // same page in a real language.
            await expect(page.locator('rs-module-url .gdpr-content h3')).toBeVisible();
            await expect(page.locator('rs-module-url .gdpr-content button')).toBeVisible();
            // No iframe before consent.
            await expect(page.locator('rs-module-url iframe')).toHaveCount(0);
            await expectScreenshot(page.locator(FRAME), `rs2-${module}.png`);
        });
    }

    /** No embedding at all: preview image plus a link button. */
    test('link', async ({ page }) => {
        await gotoModule(page, 'url-link');
        await expect(page.locator('rs-module-url .link-wrapper img')).toBeVisible();
        await expect(page.locator('rs-module-url .link-wrapper a')).toBeVisible();
        await expectScreenshot(page.locator(FRAME), 'rs2-url-link.png');
    });

    /**
     * Audio embedding, detected from the node's mime type rather than from RS2. The player points
     * straight at the node's url, so it has to stay same-origin.
     *
     * There is no image-embedding case on purpose: that branch binds `[ngSrc]` without the
     * `width`/`height` (or `fill`) `NgOptimizedImage` requires, throws NG02954 and renders an empty
     * box. A test would only pin that bug into a baseline.
     */
    test('audio embedding', async ({ page }) => {
        await gotoModule(page, 'url-audio');
        await expect(page.locator('rs-module-url .audio-wrapper video')).toBeVisible();
        await expectScreenshot(page.locator(FRAME), 'rs2-url-audio.png');
    });
});
