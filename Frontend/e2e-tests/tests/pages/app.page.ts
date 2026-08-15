import { expect, Locator, Page } from '@playwright/test';
import { settle } from '../fixtures';

/**
 * Thin page helpers for the mock suite.
 *
 * Intentionally separate from `tests/pages/*`: those page objects are written for a live
 * edu-sharing instance (they create and delete content through the REST API). The selectors below
 * are the same `data-test` hooks though, so both suites break together when the markup changes.
 */
export class AppPage {
    /** `Der Wasserkreislauf` from the mock corpus - the node every node-related test works on. */
    static readonly nodeId = '00000000-0000-4000-a000-000000000101';
    static readonly nodeTitle = 'Der Wasserkreislauf';

    static readonly loginUrl = './components/login';
    static readonly renderUrl = `./components/render/${AppPage.nodeId}`;
    static readonly searchUrl = './components/search';
    static readonly workspaceUrl = './components/workspace';
    static readonly collectionsUrl = './components/collections';

    constructor(
        private readonly page: Page,
        private readonly theme: 'light' | 'dark' = 'light',
    ) {}

    /**
     * Opens a page with `locale=none` and the project's theme.
     *
     * With `locale=none` the application renders the raw i18n keys, which makes the baselines
     * independent of the configured default language and of translation changes - only layout and
     * data show up in a diff. `theme` overrides the stored dark-mode preference for this page view
     * only (`ThemeService.registerDarkMode`).
     */
    async goto(url: string): Promise<void> {
        const separator = url.includes('?') ? '&' : '?';
        await this.page.goto(`${url}${separator}locale=none&theme=${this.theme}`);
        await settle(this.page);
    }

    async login(username = 'e2e', password = 'e2e'): Promise<void> {
        await this.page.locator('input[name="username"]').fill(username);
        await this.page.locator('input[type="password"]').fill(password);
        await this.page.locator('input[type="password"]').press('Enter');
    }

    /**
     * Waits until a page shell is rendered.
     *
     * Deliberately not the scope button of the main nav: it is hidden below the mobile breakpoint,
     * and with `locale=none` it only carries a raw i18n key anyway. Which page is shown is
     * asserted through its content in the scenarios.
     */
    async expectPageShell(): Promise<void> {
        await expect(this.mainContent).toBeVisible();
    }

    /** A row of a node list in table view. */
    row(pattern: string | RegExp): Locator {
        return this.page.locator('[role="main"] >> [role="row"]', { hasText: pattern });
    }

    /** A card of a node list in grid view. */
    card(pattern: string | RegExp): Locator {
        return this.page.locator('[role="listitem"]', { hasText: pattern });
    }

    /**
     * The page's content area - the search page marks it with `.main-content`, workspace and
     * collections with `role="main"`.
     */
    get mainContent(): Locator {
        return this.page.locator('[role="main"], .main-content').first();
    }

    /** Opens the context menu of a node list row (right click, as in the real e2e suite). */
    async openOptionsMenu(pattern: string | RegExp): Promise<void> {
        await this.row(pattern).first().click({ button: 'right' });
    }

    /** Opens the overflow menu ("...") of the actionbar, e.g. on the render page. */
    async openActionbarMenu(): Promise<void> {
        await this.page.locator('es-actionbar button').last().click();
    }

    /** Opens the "+" create menu of the top bar. */
    async openCreateMenu(): Promise<void> {
        await this.page.locator('[data-test="top-bar-add-button"]').first().click();
    }

    async openUserMenu(): Promise<void> {
        await this.page.locator('[data-test="main-nav-user-menu-button"]').click();
    }

    /** Clicks an entry of an open menu. `name` is the `OptionItem.name`, i.e. its i18n key. */
    async clickMenuItem(name: string): Promise<void> {
        await this.page.locator(`[data-test="menu-item-${name}"]`).click();
    }

    /** The topmost open dialog. */
    get dialog(): Locator {
        return this.page.locator('es-card-dialog-container').last();
    }

    /** Waits for a dialog to be open and settled, and returns it. */
    async expectDialog(): Promise<Locator> {
        const dialog = this.dialog;
        await expect(dialog).toBeVisible();
        await settle(this.page);
        return dialog;
    }

    async searchInTopBar(term: string): Promise<void> {
        const field = this.page.locator('[data-test="top-bar-search-field"]');
        await field.fill(term);
        await field.press('Enter');
        await settle(this.page);
    }
}
