import { expect, expectScreenshot, settle, test } from '../fixtures';
import { AppPage } from '../pages/app.page';

test.describe('collections', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
    });

    test('lists the collections of the mock corpus', async ({ app, page }) => {
        await app.goto(AppPage.collectionsUrl);

        await expect(page.getByText('Mathematik Sek I').first()).toBeVisible();
        await expect(page.getByText('Naturwissenschaften').first()).toBeVisible();
        await expectScreenshot(page, 'collections-root.png');
    });

    test('opens a collection and shows its references', async ({ app, page }) => {
        await app.goto(AppPage.collectionsUrl);
        await page.getByText('Mathematik Sek I').first().click();
        await settle(page);

        await expect(page.getByText('Bruchrechnen leicht gemacht').first()).toBeVisible();
        await expectScreenshot(page, 'collection-detail.png');
    });
});
