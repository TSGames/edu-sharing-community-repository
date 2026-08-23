import * as path from 'path';

// Compiled location: Frontend/e2e-tests/build/mock-backend
const e2eDir = path.resolve(__dirname, '..', '..');
const frontendDir = path.resolve(e2eDir, '..');

function env(name: string, fallback: string): string {
    const value = process.env[name];
    return value === undefined || value === '' ? fallback : value;
}

export const config = {
    /** Port the mock serves app + API on. Must match `baseURL` of the Playwright config. */
    port: Number(env('MOCK_PORT', '4200')),
    host: env('MOCK_HOST', '127.0.0.1'),
    /** Directory of the Angular build output that is served under `/edu-sharing`. */
    distDir: path.resolve(frontendDir, env('MOCK_DIST_DIR', 'dist-mock')),
    /** Static placeholder assets (themes, preview images, license icons, media samples). */
    assetsDir: path.resolve(e2eDir, 'mock-backend', 'assets'),
    /**
     * Build output of the rendering-service web component (`ng build rendering-service
     * --configuration mock`), served under `/web-component` for the standalone RS2 harness.
     */
    webComponentDir: path.resolve(
        frontendDir,
        env('MOCK_WEB_COMPONENT_DIR', 'dist-mock-web-components/rendering-service'),
    ),
    /** Serve only the REST API, e.g. when the app itself is served by `ng serve`. */
    apiOnly: process.argv.includes('--api-only') || env('MOCK_API_ONLY', '') === '1',
    /** Where unmocked REST requests are recorded. */
    unmockedLog: path.resolve(e2eDir, 'build', 'unmocked.log'),
    /**
     * Every timestamp the mock returns. Keeping this fixed is what makes relative dates
     * ("modified 2 days ago") stable across runs and therefore screenshot-comparable.
     */
    fixedTime: Date.parse('2024-01-01T12:00:00.000Z'),
};

export const REST_PREFIX = '/edu-sharing/rest';

/**
 * Root of rendering service 2. `RenderHelperService.prepareRootUrl()` pins this path in every
 * non-production build, so it is served at the origin root, not below `/edu-sharing`.
 */
export const RENDERING2_PREFIX = '/rendering2';
