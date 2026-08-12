import { expect, expectScreenshot, settle, test } from '../fixtures';
import { AppPage } from '../pages/app.page';

test.describe('workspace', () => {
    test.beforeEach(async ({ page }) => {
        const app = new AppPage(page);
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
    });

    test('lists the contents of the home folder', async ({ page }) => {
        const app = new AppPage(page);
        await app.goto(AppPage.workspaceUrl);

        await app.expectScope(/Workspace|Arbeitsbereich/i);
        await expect(page.getByText('Unterrichtsmaterial').first()).toBeVisible();
        await expect(page.getByText('Bilder').first()).toBeVisible();
        await expectScreenshot(app.mainContent, 'workspace-home.png');
    });

    test('opens a folder', async ({ page }) => {
        const app = new AppPage(page);
        await app.goto(AppPage.workspaceUrl);
        await page.getByText('Unterrichtsmaterial').first().dblclick();
        await settle(page);

        // `Unterrichtsmaterial` holds the last four materials of the corpus.
        await expect(page.getByText('Programmieren mit Scratch').first()).toBeVisible();
        await expectScreenshot(app.mainContent, 'workspace-folder.png');
    });
});
