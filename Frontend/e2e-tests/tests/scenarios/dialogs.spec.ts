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
        // Structural, not by label: the capture run renders the same dialog in a real language.
        await expect(dialog.locator('.card-dialog-avatar i')).toHaveText('accessibility');
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
        // The mocked bookmark list, not `SEARCH.NODE_STORE.LIST_EMPTY`.
        await expect(dialog.getByText('SEARCH.NODE_STORE.LIST_EMPTY')).toHaveCount(0);
        await expect(dialog.getByText('Bruchrechnen leicht gemacht')).toBeVisible();
        await expect(dialog.getByText('Photosynthese im Überblick')).toBeVisible();
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

    /** The contributors come from the node's `ccm:*contributer_*` VCard properties. */
    test('contributors', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.CONTRIBUTOR');

        const dialog = await app.expectDialog();
        // One lifecycle author, one lifecycle publisher, one metadata creator.
        await expect(dialog.getByText('Maxi Musterfrau')).toBeVisible();
        await expect(dialog.getByText('Landesbildungsserver')).toBeVisible();
        await expect(dialog.getByText('End Toend')).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-contributors.png');
    });

    test('shortcut management', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.ADD_SHORTCUT');

        const dialog = await app.expectDialog();
        // Two `default` entries and one `ref` entry from the mocked dashboard shortcuts.
        await expect(dialog.getByText('Arbeitsbereich')).toBeVisible();
        await expect(dialog.getByText('Die Weimarer Republik')).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-shortcut-management.png');
    });

    /**
     * The share dialog - the widest dialog surface in the application. The mocked permissions are
     * populated on purpose, so the screenshot covers every authority kind a permission list can
     * hold instead of an empty list: the owner, an invited user, a group, and "everyone" (which
     * the dialog renders as its own "published" row).
     */
    test('share (invite)', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.INVITE');

        const dialog = await app.expectDialog();
        await expect(dialog.getByText('Maxi Musterfrau').first()).toBeVisible();
        await expect(dialog.getByText('Lehrkräfte').first()).toBeVisible();
        // The "published" row the EVERYONE entry is rendered as (its own group in the
        // sharing tab, not the separate publish tab).
        await expect(dialog.locator('es-share-dialog-permission.link')).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-share.png');
    });

    /**
     * Simple edit - three sections, each of which replaces itself with an info box when its
     * preconditions are not met. The mock is set up so all three render their real controls:
     *
     * - metadata: the mds group `io_simple` (deliberately a short view, two widgets)
     * - invite: the parent folder is not shared, so the toggles are offered instead of
     *   `SIMPLE_EDIT.INVITE.ERROR_INHERIT`
     * - license: `TOOLPERMISSION_LICENSE` plus a CC BY 4.0 license on the node, so the source and
     *   license toggles are offered instead of `SIMPLE_EDIT.LICENSE.INVALID_STATE`
     *
     * With `locale=none` the toggle labels are raw i18n keys and therefore much wider than the
     * translated ones; that they overflow their group is a property of the labels, not a defect
     * the baseline should hide.
     */
    test('simple edit', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.EDIT_SIMPLE');

        const dialog = await app.expectDialog();
        await expect(page.locator('[data-test="more-metadata-button"]')).toBeVisible();
        // Values come from the node fixture, not from an empty form.
        await expect(dialog.getByText(AppPage.nodeTitle).first()).toBeVisible();
        // Exactly the two widgets of the `io_simple` view.
        await expect(dialog.locator('es-mds-editor-widget-container')).toHaveCount(2);
        // Both other sections show their options, not their blocked state.
        await expect(dialog.locator('es-simple-edit-invite mat-button-toggle-group')).toHaveCount(2);
        await expect(dialog.locator('es-simple-edit-license mat-button-toggle-group')).toHaveCount(
            2,
        );
        await expect(dialog.locator('es-info-message')).toHaveCount(0);
        await screenshotDialog(page, dialog, 'dialog-simple-edit.png');
    });

    /**
     * The license editor - the largest single form of the application after the metadata editor.
     * The node carries a CC BY 4.0 license, so the dialog opens on the Creative Commons branch
     * with its attribution fields instead of the empty default.
     */
    test('license', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.LICENSE');

        const dialog = await app.expectDialog();
        // The node's CC BY license preselects its radio button - an empty form would select none.
        await expect(
            dialog.locator('mat-radio-button.mat-mdc-radio-checked').first(),
        ).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-license.png');
    });

    /**
     * The workflow dialog. Its history below the form comes from the mocked
     * `GET .../workflow`; the status list needs no configuration, `NodeHelperService.getWorkflows()`
     * falls back to the four built-in states.
     */
    test('workflow', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.WORKFLOW');

        const dialog = await app.expectDialog();
        // Both history entries, i.e. the mocked history was applied.
        await expect(dialog.getByText('Bitte fachlich prüfen.')).toBeVisible();
        await expect(dialog.getByText('Erstfassung hochgeladen.')).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-workflow.png');
    });

    /** The only dialog of the suite that acts on a *folder* rather than a file. */
    test('folder template', async ({ app, page }) => {
        await app.openOptionsMenu('Unterrichtsmaterial');
        await app.clickMenuItem('OPTIONS.TEMPLATE');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-node-template.png');
    });

    /**
     * The share history, reachable only from inside the share dialog. The mocked history is built
     * so that all three change kinds the dialog can render appear: added, modified, removed.
     */
    test('share history', async ({ app, page }) => {
        await app.openOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.INVITE');
        await app.expectDialog();

        // The link is addressed structurally: the capture run translates its label.
        await page.locator('es-mat-link.history').click();
        const dialog = await app.expectDialog();
        // Three history entries, each with at least one change row - the labels are translated in
        // the capture run, so the assertion goes through the markup.
        await expect(dialog.locator('.history-entry, .entry').first()).toBeVisible();
        await expect(dialog.getByText('maxi').first()).toBeVisible();
        await expect(dialog.getByText('GROUP_lehrkraefte').first()).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-share-history.png');
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
 * Dialogs that `OptionItem.scopes` restricts to the search page.
 */
test.describe('dialogs from the search page', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
        await app.goto(AppPage.searchUrl);
    });

    /** Gated by the config flag `nodeReport`, which the mock switches on. */
    test('node report', async ({ app, page }) => {
        await app.openCardOptionsMenu(AppPage.nodeTitle);
        await app.clickMenuItem('OPTIONS.NODE_REPORT');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-node-report.png');
    });

    /**
     * The saved searches of the mock corpus, listed by `SavedSearchesService`. Its button lives in
     * the filter sidebar, which the search page keeps collapsed until the edge handle opens it.
     */
    test('saved searches', async ({ app, page }) => {
        await page.locator('.edge-toggle.side-start').click();
        await page.locator('.saved-searches-button').click();

        const dialog = await app.expectDialog();
        await expect(dialog.getByText('Wasser').first()).toBeVisible();
        await expect(dialog.getByText('Geometrie').first()).toBeVisible();
        await screenshotDialog(page, dialog, 'dialog-saved-searches.png');
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

    /** Two mocked relations of different types, so the dialog renders both of its groups. */
    test('node relations', async ({ app, page }) => {
        await app.openActionbarMenu();
        await app.clickMenuItem('OPTIONS.RELATIONS');

        const dialog = await app.expectDialog();
        await expect(dialog.getByText('NODE_RELATIONS.NO_RELATIONS')).toHaveCount(0);
        await expect(dialog.locator('es-node-row')).toHaveCount(2);
        await screenshotDialog(page, dialog, 'dialog-node-relations.png');
    });

    test('download metadata', async ({ app, page }) => {
        await app.openActionbarMenu();
        await app.clickMenuItem('OPTIONS.DOWNLOAD_METADATA');

        const dialog = await app.expectDialog();
        await screenshotDialog(page, dialog, 'dialog-download-metadata.png');
    });
});
