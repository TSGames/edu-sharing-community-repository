import { expect, expectScreenshot, PROGRESS_BAR, settle, test } from '../fixtures';
import { AppPage } from '../pages/app.page';

test.describe('login', () => {
    test('shows the login form', async ({ page, consoleErrors }) => {
        const app = new AppPage(page);
        await app.goto(AppPage.loginUrl);

        await expect(page.locator('input[name="username"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expectScreenshot(page, 'login-form.png', {
            mask: [page.locator(PROGRESS_BAR)],
        });
        expect(consoleErrors).toEqual([]);
    });

    test('rejects unknown credentials', async ({ page }) => {
        const app = new AppPage(page);
        await app.goto(AppPage.loginUrl);
        await app.login('nobody', 'wrong-password');
        await settle(page);

        // The mock answers `INVALID_CREDENTIALS`, so we must still be on the login page.
        await expect(page).toHaveURL(/components\/login/);
        await expect(page.locator('input[name="username"]')).toBeVisible();
    });

    test('signs in and lands on the start page', async ({ page }) => {
        const app = new AppPage(page);
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
        await settle(page);

        // Not the scope button: it is hidden below the mobile breakpoint.
        await expect(app.mainContent).toBeVisible();
        await expectScreenshot(page, 'start-page.png', {
            mask: [page.locator(PROGRESS_BAR)],
        });
    });
});
