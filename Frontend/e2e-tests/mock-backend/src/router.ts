import { IncomingMessage, ServerResponse } from 'http';
import { Session } from './session';

export interface Ctx {
    req: IncomingMessage;
    res: ServerResponse;
    /** Path parameters of the matched route, e.g. `:node` -> `params.node`. */
    params: { [key: string]: string };
    query: URLSearchParams;
    /** Parsed JSON request body, `undefined` for GET/DELETE or an unparsable body. */
    body: any;
    session: Session;
}

export type Handler = (ctx: Ctx) => void | Promise<void>;

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface Route {
    method: Method;
    pattern: string;
    regex: RegExp;
    keys: string[];
    handler: Handler;
}

/**
 * Minimal path router.
 *
 * Patterns support `:name` for a single path segment and a trailing `*` for the rest of the path
 * (exposed as `params.rest`). Routes are matched in registration order.
 */
export class Router {
    private readonly routes: Route[] = [];

    get(pattern: string, handler: Handler): void {
        this.add('GET', pattern, handler);
    }

    post(pattern: string, handler: Handler): void {
        this.add('POST', pattern, handler);
    }

    put(pattern: string, handler: Handler): void {
        this.add('PUT', pattern, handler);
    }

    delete(pattern: string, handler: Handler): void {
        this.add('DELETE', pattern, handler);
    }

    add(method: Method, pattern: string, handler: Handler): void {
        const keys: string[] = [];
        const source = pattern
            .split('/')
            .map((segment) => {
                if (segment === '*') {
                    keys.push('rest');
                    return '(.*)';
                }
                if (segment.startsWith(':')) {
                    keys.push(segment.slice(1));
                    return '([^/]+)';
                }
                return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            })
            .join('/');
        this.routes.push({ method, pattern, regex: new RegExp(`^${source}$`), keys, handler });
    }

    match(
        method: string,
        pathname: string,
    ): { handler: Handler; params: { [key: string]: string } } | null {
        for (const route of this.routes) {
            if (route.method !== method) {
                continue;
            }
            const match = route.regex.exec(pathname);
            if (!match) {
                continue;
            }
            const params: { [key: string]: string } = {};
            route.keys.forEach((key, index) => {
                params[key] = decodeURIComponent(match[index + 1]);
            });
            return { handler: route.handler, params };
        }
        return null;
    }
}
