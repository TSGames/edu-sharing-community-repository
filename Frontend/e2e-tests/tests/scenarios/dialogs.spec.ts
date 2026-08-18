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

/**
 * Screenshots a dialog, growing the viewport so as much of it as possible is visible.
 *
 * Unlike the metadata editor, some dialogs have a fixed maximum height and stay scrollable no
 * matter how tall the viewport gets (simple edit is one). Those are captured scrolled to the top
 * instead of failing - `settle()` resets the scroll position, so it stays deterministic.
 */
async function screenshotDialog(page: any, dialog: any, name: string): Promise<void> {
    const content = dialog.locator('.card-content').first();
    if ((await content.count()) > 0) {
        await expandViewportToFit(page, content, { assertFits: false });
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
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.DELETE');

        const dialog = await app.expectDialog();
        // Nothing is deleted until the confirm button is pressed.
        await expect(page.locator('[data-test="dialog-button-YES_DELETE"]')).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-delete-nodes.png');
    });

    test('contributors', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.CONTRIBUTOR');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-contributors.png');
    });

    test('shortcut management', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.ADD_SHORTCUT');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-shortcut-management.png');
    });

    /**
     * The share dialog - the widest dialog surface in the application. The mocked permissions are
     * populated on purpose (owner, an invited user, a group, one inherited entry), so the screenshot
     * covers the rendering of all three authority kinds instead of an empty list.
     */
    test('share (invite)', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.INVITE');

        const dialog = await app.expectDialog();
        await expect(dialog.getByText('Maxi Musterfrau').first()).toBeVisible();
        await expect(dialog.getByText('Lehrkräfte').first()).toBeVisible();
        await expect(dialog.getByText('Alle registrierten Nutzer:innen').first()).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-share.png');
    });

    test('simple edit', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.EDIT_SIMPLE');

        const dialog = await app.expectDialog();
        await expect(page.locator('[data-test="more-metadata-button"]')).toBeVisible();
        // Values come from the node fixture, not from an empty form.
        await expect(dialog.getByText(AppPage.nodeTitle).first()).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-simple-edit.png');
    });

    test('create variant', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
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
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.EDIT');
        const editor = await app.expectDialog();

        await editor.getByText('Öffentlich sichtbar').first().click();
        await page.keyboard.press('Escape');

        const dialog = await app.expectDialog();
        await expect(page.locator('[data-test="dialog-button-DISCARD"]')).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-discard-changes.png');
    });
});

/**
 * Dialogs that `OptionItem.scopes` restricts to `Scope.Render`, i.e. they only exist on the node
 * detail page. That page renders through the mocked rendering service 2 (see `render.spec.ts`).
 */
test.describe('dialogs from the render page', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
        await app.goto(AppPage.renderUrl);
        await expect(page.locator('rs-root img')).toBeVisible();
    });

    test('qr code', async ({ app, page }) => {
        await app.openActionbarMenu();
        await app.clickMenuItem('OPTIONS.QR_CODE');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-qr-code.png');
    });

    test('embed node', async ({ app, page }) => {
        await app.openActionbarMenu();
        await app.clickMenuItem('OPTIONS.EMBED');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-node-embed.png');
    });

    test('node relations', async ({ app, page }) => {
        await app.openActionbarMenu();
        await app.clickMenuItem('OPTIONS.RELATIONS');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-node-relations.png');
    });

    test('download metadata', async ({ app, page }) => {
        await app.openActionbarMenu();
        await app.clickMenuItem('OPTIONS.DOWNLOAD_METADATA');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-download-metadata.png');
    });
});
