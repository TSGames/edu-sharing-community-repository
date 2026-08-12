import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { config, REST_PREFIX } from './config';
import { json, readBody, text } from './http';
import { createApiRouter } from './routes';
import { getSession } from './session';

const MIME_TYPES: { [extension: string]: string } = {
    '.html': 'text/html;charset=UTF-8',
    '.js': 'application/javascript;charset=UTF-8',
    '.mjs': 'application/javascript;charset=UTF-8',
    '.css': 'text/css;charset=UTF-8',
    '.json': 'application/json;charset=UTF-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.map': 'application/json;charset=UTF-8',
    '.txt': 'text/plain;charset=UTF-8',
};

const unmockedRequests = new Set<string>();

function logUnmocked(method: string, pathname: string): void {
    const entry = `${method} ${pathname}`;
    if (unmockedRequests.has(entry)) {
        return;
    }
    unmockedRequests.add(entry);
    console.warn(`[mock] MISS ${entry}`);
    try {
        fs.mkdirSync(path.dirname(config.unmockedLog), { recursive: true });
        fs.appendFileSync(config.unmockedLog, `${entry}\n`);
    } catch {
        // Logging must never take the server down.
    }
}

/** Resolves a request path to a file inside `root`, guarding against path traversal. */
function resolveFile(root: string, relativePath: string): string | null {
    const target = path.resolve(root, `.${path.posix.normalize(`/${relativePath}`)}`);
    if (!target.startsWith(root)) {
        return null;
    }
    try {
        return fs.statSync(target).isFile() ? target : null;
    } catch {
        return null;
    }
}

function sendFile(res: http.ServerResponse, file: string, statusCode = 200): void {
    const body = fs.readFileSync(file);
    res.writeHead(statusCode, {
        'Content-Type': MIME_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': body.length,
        // No caching at all: a stale bundle or image between test runs is a screenshot bug that is
        // very hard to track down.
        'Cache-Control': 'no-store',
    });
    res.end(body);
}

/**
 * Serves static mock assets (`/edu-sharing/themes|preview|ccimages/...`).
 *
 * Icon paths are computed at runtime by the frontend, so unknown files fall back to a placeholder
 * instead of 404 — a broken image would otherwise show up in every screenshot.
 */
function serveAsset(res: http.ServerResponse, pathname: string): boolean {
    const relativePath = pathname.replace(/^\/edu-sharing\//, '');
    const file = resolveFile(config.assetsDir, relativePath);
    if (file) {
        sendFile(res, file);
        return true;
    }
    const extension = path.extname(pathname).toLowerCase();
    const fallback =
        extension === '.png' || extension === '.jpg'
            ? resolveFile(config.assetsDir, 'preview/preview-1.png')
            : resolveFile(config.assetsDir, 'themes/default/images/common/placeholder.svg');
    if (fallback) {
        sendFile(res, fallback);
        return true;
    }
    return false;
}

export function createServer(): http.Server {
    const apiRouter = createApiRouter();

    return http.createServer((req, res) => {
        void handle(req, res).catch((error) => {
            console.error('[mock] handler failed', error);
            if (!res.headersSent) {
                json(res, { error: 'MockError', message: String(error) }, 500);
            }
        });
    });

    async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
        const pathname = url.pathname;
        const method = req.method ?? 'GET';

        // 1. REST API
        if (pathname.startsWith(REST_PREFIX)) {
            // The frontend appends a trailing slash on some endpoints; the backend treats
            // `/organizations/-home-/` and `/organizations/-home-` as the same resource.
            const apiPath = pathname.slice(REST_PREFIX.length).replace(/\/+$/, '') || '/';
            const match = apiRouter.match(method, apiPath);
            if (!match) {
                logUnmocked(method, pathname);
                json(
                    res,
                    {
                        error: 'NotMockedException',
                        message: `${method} ${apiPath} is not mocked. See mock-backend/README.md.`,
                    },
                    501,
                );
                return;
            }
            await match.handler({
                req,
                res,
                params: match.params,
                query: url.searchParams,
                body: await readBody(req),
                session: getSession(req),
            });
            return;
        }

        // 2. static mock assets
        if (
            pathname.startsWith('/edu-sharing/themes/') ||
            pathname.startsWith('/edu-sharing/preview/') ||
            pathname.startsWith('/edu-sharing/ccimages/')
        ) {
            if (serveAsset(res, pathname)) {
                return;
            }
        }

        if (config.apiOnly) {
            text(res, 'Mock backend runs in --api-only mode.', 404);
            return;
        }

        // 3. built Angular application
        if (pathname === '/' || pathname === '/edu-sharing') {
            res.writeHead(302, { Location: '/edu-sharing/' });
            res.end();
            return;
        }
        if (pathname.startsWith('/edu-sharing/')) {
            const file = resolveFile(config.distDir, pathname.slice('/edu-sharing/'.length));
            if (file) {
                sendFile(res, file);
                return;
            }
            // 4. SPA fallback
            const index = resolveFile(config.distDir, 'index.html');
            if (index) {
                sendFile(res, index);
                return;
            }
            text(
                res,
                `No build found in ${config.distDir}. Run "npm run build:mock" first.`,
                500,
            );
            return;
        }

        logUnmocked(method, pathname);
        text(res, 'Not found', 404);
    }
}
