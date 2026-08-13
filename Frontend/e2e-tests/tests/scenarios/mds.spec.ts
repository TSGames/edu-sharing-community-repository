import { expandViewportToFit, expect, expectScreenshot, settle, test } from '../fixtures';
import { AppPage } from '../pages/app.page';

/**
 * The metadata editor, opened through "edit metadata" on a workspace node.
 *
 * The mocked `io` group uses one widget of nearly every `MdsWidgetType` plus the native widgets
 * (preview, author, license, version), so this single screenshot covers the whole widget surface -
 * the part of the application with the highest regression rate (see `Frontend/CLAUDE.md`).
 *
 * The viewport grows until the dialog fits, so the screenshot shows the editor over its full
 * height - in the width of each project, phone included.
 */
test.describe('metadata editor', () => {
    test('renders all widget types', async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
        await app.goto(AppPage.workspaceUrl);

        await app.openOptionsMenu('Der Wasserkreislauf');
        await page.locator('[data-test="menu-item-OPTIONS.EDIT"]').click();

        const dialog = page.locator('es-card-dialog-container, mat-dialog-container').first();
        await expect(dialog).toBeVisible();
        await settle(page);

        // The dialog scrolls internally - grow the viewport until the whole editor is visible.
        await expandViewportToFit(page, dialog.locator('.card-content').first());

        // Spot checks across the whole form: first widget, a middle one, and the last native one.
        await expect(dialog.getByText('Beschreibung').first()).toBeVisible();
        await expect(dialog.getByText('Altersspanne').first()).toBeVisible();
        await expect(dialog.getByText('Autor:in').first()).toBeVisible();

        await expectScreenshot(page, 'mds-editor-all-widgets.png');
    });
});
