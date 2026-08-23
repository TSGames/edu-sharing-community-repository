import { expect, expectScreenshot, settle, test } from '../fixtures';
import { AppPage } from '../pages/app.page';

test.describe('search', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
    });

    test('lists the results of the mock corpus', async ({ app, page }) => {
        await app.goto(AppPage.searchUrl);

        // First page of the fixed corpus: 10 materials, `Der Wasserkreislauf` among them.
        await expect(page.getByText('Der Wasserkreislauf').first()).toBeVisible();
        await expect(page.getByText('Bruchrechnen leicht gemacht').first()).toBeVisible();
        await expectScreenshot(page, 'search-results.png');
    });

    test('filters by the search term', async ({ app, page }) => {
        await app.goto(AppPage.searchUrl);
        await app.searchInTopBar('Wasser');
        await settle(page);

        await expect(page.getByText('Der Wasserkreislauf').first()).toBeVisible();
        await expect(page.getByText('Bruchrechnen leicht gemacht')).toHaveCount(0);
        await expectScreenshot(page, 'search-results-filtered.png');
    });
});
