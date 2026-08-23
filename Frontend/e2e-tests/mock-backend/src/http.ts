import { IncomingMessage, ServerResponse } from 'http';

/**
 * Sends a JSON response.
 *
 * `no-store` keeps the browser from serving a cached body after the mock changed its state
 * (e.g. after login), which would otherwise show up as a flaky screenshot.
 */
export function json(res: ServerResponse, body: unknown, statusCode = 200): void {
    const payload = JSON.stringify(body ?? null);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json;charset=UTF-8',
        'Content-Length': Buffer.byteLength(payload),
        'Cache-Control': 'no-store',
    });
    res.end(payload);
}

export function noContent(res: ServerResponse, statusCode = 200): void {
    res.writeHead(statusCode, { 'Cache-Control': 'no-store' });
    res.end();
}

export function text(res: ServerResponse, body: string, statusCode = 200): void {
    res.writeHead(statusCode, {
        'Content-Type': 'text/plain;charset=UTF-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store',
    });
    res.end(body);
}

export function html(res: ServerResponse, body: string, statusCode = 200): void {
    res.writeHead(statusCode, {
        'Content-Type': 'text/html;charset=UTF-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store',
    });
    res.end(body);
}

export async function readBody(req: IncomingMessage): Promise<any> {
    if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'HEAD') {
        return undefined;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(chunk as Buffer);
    }
    if (chunks.length === 0) {
        return undefined;
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

export function parseCookies(req: IncomingMessage): { [key: string]: string } {
    const header = req.headers.cookie;
    if (!header) {
        return {};
    }
    const cookies: { [key: string]: string } = {};
    for (const part of header.split(';')) {
        const index = part.indexOf('=');
        if (index > 0) {
            cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
        }
    }
    return cookies;
}

export function setCookie(res: ServerResponse, name: string, value: string, maxAge: number): void {
    res.setHeader(
        'Set-Cookie',
        `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`,
    );
}
