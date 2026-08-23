import { expect, expectScreenshot, settle, test } from '../fixtures';
import { AppPage } from '../pages/app.page';

test.describe('workspace', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
    });

    test('lists the contents of the home folder', async ({ app, page }) => {
        await app.goto(AppPage.workspaceUrl);

        await app.expectPageShell();
        await expect(app.row('Unterrichtsmaterial')).toBeVisible();
        await expect(app.row('Bilder')).toBeVisible();
        await expectScreenshot(page, 'workspace-home.png');
    });

    test('opens a folder', async ({ app, page }) => {
        await app.goto(AppPage.workspaceUrl);
        // The row of the node list, not the entry of the folder tree in the sidebar.
        await app.row('Unterrichtsmaterial').first().dblclick();
        await settle(page);

        // `Unterrichtsmaterial` holds the last four materials of the corpus.
        await expect(app.row('Programmieren mit Scratch')).toBeVisible();
        await expectScreenshot(page, 'workspace-folder.png');
    });
});
