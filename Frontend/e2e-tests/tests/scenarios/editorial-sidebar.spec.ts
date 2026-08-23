import { expandViewportToFit, expect, expectScreenshot, settle, test } from '../fixtures';
import { AppPage } from '../pages/app.page';

/**
 * The editorial sidebar (`src/app/features/editorial-sidebar`).
 *
 * It is the same component on every page - workspace, search, collections and the render page each
 * mount it with a different `primaryMode`, which is what decides the option list. The options
 * themselves are `OptionItem`s and gated exactly like the context-menu entries (scope, constrains,
 * permissions, toolpermissions).
 *
 * Like the dialogs this runs in the `chromium` project only (see `testIgnore` in
 * `playwright.config.ts`): below 900px the sidebar turns into a full-screen overlay, and the
 * desktop baseline is where regressions show.
 */

/** Screenshots the sidebar, growing the viewport so as much of its panel as possible is visible. */
async function screenshotSidebar(page: any, name: string): Promise<void> {
    const container = page.locator('es-editorial-sidebar .sidebar-container').first();
    if ((await container.count()) > 0) {
        await expandViewportToFit(page, container, { assertFits: false });
    }
    await expectScreenshot(page, name);
}

test.describe('editorial sidebar in the workspace', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
        await app.goto(AppPage.workspaceUrl);
    });

    /**
     * Without a selection only the options that act on the *folder* remain - in the workspace the
     * user home is a folder, so "sort into" is offered while every node option is gone.
     */
    test('lists only the folder options without a selection', async ({ app, page }) => {
        await app.openSidebar();

        await expect(app.sidebarOption('SORT_INTO')).toHaveCount(1);
        await expect(app.sidebarOption('PREVIEW')).toHaveCount(0);
        await screenshotSidebar(page, 'sidebar-options-no-selection.png');
    });

    test('lists the options of the selected node', async ({ app, page }) => {
        await app.selectRow(AppPage.nodeTitle);
        await app.openSidebar();

        // Everything the mock's toolpermissions and the node's rights allow.
        for (const option of [
            'PREVIEW',
            'MANAGE_CONTENT',
            'VERSION_MANAGEMENT',
            'VIEWS_AND_USAGE',
        ]) {
            await expect(app.sidebarOption(option)).toHaveCount(1);
        }
        await screenshotSidebar(page, 'sidebar-options.png');
    });

    /**
     * The preview: the node rendered through the mocked rendering service 2, with a metadata block
     * below it. That block uses the mds group `preview_sidebar` - without the group the panel
     * renders the sticky bar and nothing else.
     */
    test('preview', async ({ app, page }) => {
        await app.selectRow(AppPage.nodeTitle);
        await app.openSidebar();
        await app.clickSidebarOption('PREVIEW');

        // The rendered image, not just the `@defer` placeholder.
        await expect(app.sidebar.locator('rs-root img')).toBeVisible();
        await expect(app.sidebar.locator('es-mds-editor-widget-container')).toHaveCount(2);
        await screenshotSidebar(page, 'sidebar-preview.png');
    });

    /** Version history, read from `GET .../versions/metadata`. */
    test('version management', async ({ app, page }) => {
        await app.selectRow(AppPage.nodeTitle);
        await app.openSidebar();
        await app.clickSidebarOption('VERSION_MANAGEMENT');

        // The free-text comment of the newest mocked version.
        await expect(app.sidebar.getByText('Lizenz auf CC BY 4.0 gesetzt.')).toBeVisible();
        await screenshotSidebar(page, 'sidebar-version-management.png');
    });

    /**
     * Views and usage. The metric cards sum the mocked tracking counters, the lists below come
     * from `GET /usage/v1/usages/node/{id}` and `…/collections`.
     */
    test('views and usage', async ({ app, page }) => {
        await app.selectRow(AppPage.nodeTitle);
        await app.openSidebar();
        await app.clickSidebarOption('VIEWS_AND_USAGE');

        // 128 direct + 34 embedded views, 17 downloads, and 2 embeddings + 2 collections.
        await expect(app.sidebar.getByText('162', { exact: true }).first()).toBeVisible();
        await expect(app.sidebar.getByText('Moodle: Naturwissenschaften 7a')).toBeVisible();
        await expect(app.sidebar.getByText('WordPress: Geografie 9b')).toBeVisible();
        await expect(app.sidebar.getByText('Mathematik Sek I')).toBeVisible();
        await screenshotSidebar(page, 'sidebar-views-and-usage.png');
    });

    /**
     * The node picker ("Einsortieren"). Its collection tree assigns `collection.parent.id`, so the
     * mocked collections must carry a parent - otherwise the tree never leaves its spinner.
     */
    test('manage content', async ({ app, page }) => {
        await app.selectRow(AppPage.nodeTitle);
        await app.openSidebar();
        await app.clickSidebarOption('MANAGE_CONTENT');

        await expect(app.sidebar.locator('[data-test="loading-spinner"]')).toHaveCount(0);
        await expect(app.sidebar.getByText('Mathematik').first()).toBeVisible();
        await screenshotSidebar(page, 'sidebar-manage-content.png');
    });

    /**
     * "Sort into" is the same picker from the other direction. It only appears below a real folder
     * (`customShowCallback` requires a folder or map parent), never in the workspace root.
     */
    test('sort into inside a folder', async ({ app, page }) => {
        await app.row('Unterrichtsmaterial').first().dblclick();
        await settle(page);
        await app.openSidebar();
        await app.clickSidebarOption('SORT_INTO');

        await expect(app.sidebar.locator('[data-test="loading-spinner"]')).toHaveCount(0);
        await screenshotSidebar(page, 'sidebar-sort-into.png');
    });
});

test.describe('editorial sidebar in the collections', () => {
    test.beforeEach(async ({ app, page }) => {
        await app.goto(AppPage.loginUrl);
        await app.login();
        await page.waitForURL(/components\/(workspace|search)/);
        await app.goto(AppPage.collectionsUrl);
    });

    /** Collections scope only, and gated by `TOOLPERMISSION_CREATE_ELEMENTS_COLLECTIONS`. */
    test('add collection', async ({ app, page }) => {
        await app.openSidebar();
        await app.clickSidebarOption('ADD_COLLECTION');

        await expect(page.locator('[data-test="button-add-collection-CREATE"]')).toBeVisible();
        await expect(page.locator('[data-test="button-add-collection-COPY"]')).toBeVisible();
        await screenshotSidebar(page, 'sidebar-add-collection.png');
    });
});
