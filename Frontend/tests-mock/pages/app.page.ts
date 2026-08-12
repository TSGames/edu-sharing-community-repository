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
    static readonly loginUrl = './components/login';
    static readonly searchUrl = './components/search';
    static readonly workspaceUrl = './components/workspace';
    static readonly collectionsUrl = './components/collections';

    constructor(private readonly page: Page) {}

    async goto(url: string): Promise<void> {
        await this.page.goto(url);
        await settle(this.page);
    }

    async login(username = 'e2e', password = 'e2e'): Promise<void> {
        await this.page.locator('input[name="username"]').fill(username);
        await this.page.locator('input[type="password"]').fill(password);
        await this.page.locator('input[type="password"]').press('Enter');
    }

    async expectScope(pattern: string | RegExp): Promise<void> {
        await expect(this.page.locator('[data-test="main-nav-scope-button"]')).toHaveText(pattern);
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

    async searchInTopBar(term: string): Promise<void> {
        const field = this.page.locator('[data-test="top-bar-search-field"]');
        await field.fill(term);
        await field.press('Enter');
        await settle(this.page);
    }
}
