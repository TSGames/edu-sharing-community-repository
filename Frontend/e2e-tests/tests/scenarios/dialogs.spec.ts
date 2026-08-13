import { expandViewportToFit, expect, expectScreenshot, settle, test } from '../fixtures';
import { AppPage } from '../pages/app.page';

/**
 * Dialogs of `DialogsService` (`src/app/features/dialogs/dialogs.service.ts`).
 *
 * Covered are the dialogs that are reachable through the real UI and get by with the endpoints the
 * mock backend already serves. Everything else is listed in `e2e-tests/README.md` together with the
 * reason it is out of scope (render-only options, popup windows, uploads, live typeahead, ...).
 *
 * Dialogs run in the `chromium` project only - see `testIgnore` in `playwright.config.ts`. On a
 * phone almost every dialog is full screen, and the desktop baseline is where regressions show.
 */

/** Every dialog is at most as tall as the viewport allows; grow it when it scrolls internally. */
async function screenshotDialog(page: any, dialog: any, name: string): Promise<void> {
    const content = dialog.locator('.card-content').first();
    if ((await content.count()) > 0) {
        await expandViewportToFit(page, content);
    }
    await expectScreenshot(page, name);
}

test.describe('dialogs from the user menu', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
        await app.goto(AppPage.workspaceUrl);
    });

    test('accessibility settings', async ({ app, page }) => {
        await app.openUserMenu();
        await app.clickMenuItem('OPTIONS.ACCESSIBILITY');

        const dialog = await app.expectDialog();
        await expect(dialog.getByText(/ACCESSIBILITY/).first()).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-accessibility.png');
    });

    test('third party licenses', async ({ app, page }) => {
        await app.openUserMenu();
        await app.clickMenuItem('LICENSE_INFORMATION');

        const dialog = await app.expectDialog();
        // Entries come from the mocked `/_about/licenses`.
        await expect(dialog.getByText('@angular/core').first()).toBeVisible();
        await expect(dialog.getByText('pdfjs').first()).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-third-party-licenses.png');
    });

    test('bookmarks (node store)', async ({ app, page }) => {
        await app.openUserMenu();
        await app.clickMenuItem('SEARCH.NODE_STORE.TITLE');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-node-store.png');
    });
});

test.describe('dialogs from the workspace', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
        await app.goto(AppPage.workspaceUrl);
    });

    test('new folder', async ({ app, page }) => {
        await app.openCreateMenu();
        await app.clickMenuItem('WORKSPACE.ADD_FOLDER');

        const dialog = await app.expectDialog();
        await expect(page.locator('[data-test="add-folder-name-input"]')).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-add-folder.png');
    });

    test('delete nodes', async ({ app, page }) => {
        await app.openOptionsMenu('Der Wasserkreislauf');
        await app.clickMenuItem('OPTIONS.DELETE');

        const dialog = await app.expectDialog();
        // Nothing is deleted until the confirm button is pressed.
        await expect(page.locator('[data-test="dialog-button-YES_DELETE"]')).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-delete-nodes.png');
    });

    test('contributors', async ({ app, page }) => {
        await app.openOptionsMenu('Der Wasserkreislauf');
        await app.clickMenuItem('OPTIONS.CONTRIBUTOR');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-contributors.png');
    });

    test('shortcut management', async ({ app, page }) => {
        await app.openOptionsMenu('Der Wasserkreislauf');
        await app.clickMenuItem('OPTIONS.ADD_SHORTCUT');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-shortcut-management.png');
    });

    test('create variant', async ({ app, page }) => {
        await app.openOptionsMenu('Der Wasserkreislauf');
        await app.clickMenuItem('OPTIONS.VARIANT');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-create-variant.png');
    });

    /**
     * The generic dialog, reached through its most common path: leaving an editor with unsaved
     * changes. `GenericDialogComponent` is shared by roughly 20 call sites.
     *
     * The confirmation only appears on Escape / the X button, not on the CANCEL button - the
     * editor switches to `Closable.Confirm` once it has user changes
     * (`mds-editor-dialog.component.ts`), and that mode only guards those triggers
     * (`card-dialog-ref.ts`).
     */
    test('generic confirm dialog when discarding changes', async ({ app, page }) => {
        await app.openOptionsMenu('Der Wasserkreislauf');
        await app.clickMenuItem('OPTIONS.EDIT');
        const editor = await app.expectDialog();

        await editor.getByText('Öffentlich sichtbar').first().click();
        await page.keyboard.press('Escape');

        const dialog = await app.expectDialog();
        await expect(page.locator('[data-test="dialog-button-DISCARD"]')).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-discard-changes.png');
    });
});
