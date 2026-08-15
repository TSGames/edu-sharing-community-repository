import { expect, expectScreenshot, settle, test } from '../fixtures';
import { AppPage } from '../pages/app.page';

/**
 * The node detail page (`components/render/:node`), rendered by **rendering service 2**.
 *
 * `RenderMainPageComponent` picks the render2 page because the mocked `/_about` announces the
 * `rendering-service-2` plugin. In a non-production build `RenderHelperService.prepareRootUrl()`
 * pins the RS2 root to the dev proxy path `/rendering2`, which the mock serves at the origin root -
 * so no proxy and no second server are involved.
 *
 * The mocked RS2 answers with `module: 'IMAGE'` and a single, non-deferred object link. That is the
 * one deterministic renderer module: video and audio mount media players, PDF mounts the pdf
 * viewer, H5P/Moodle/url mount iframes.
 */
test.describe('render page', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
    });

    test('renders a node through rendering service 2', async ({ app, page }) => {
        await app.goto(AppPage.renderUrl);

        // The image itself, not just the `@defer` placeholder spinner.
        await expect(page.locator('rs-root img')).toBeVisible();
        await expect(page.getByText(AppPage.nodeTitle).first()).toBeVisible();
        // The metadata block below the renderer uses the mds group `io_render`.
        await expect(page.getByText('Allgemein').first()).toBeVisible();
        await settle(page);

        await expectScreenshot(page, 'render-page.png');
    });
});
