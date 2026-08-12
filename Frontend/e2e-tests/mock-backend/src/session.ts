import { IncomingMessage } from 'http';
import { parseCookies } from './http';

export const SESSION_COOKIE = 'MOCK_SESSION';

export interface KnownUser {
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    isAdmin: boolean;
}

/** The only credentials the mock accepts — same users the real e2e suite uses. */
export const KNOWN_USERS: { [credentials: string]: KnownUser } = {
    'e2e:e2e': {
        userName: 'e2e',
        firstName: 'End',
        lastName: 'Toend',
        email: 'e2e@example.org',
        isAdmin: false,
    },
    'admin:admin': {
        userName: 'admin',
        firstName: 'Admin',
        lastName: 'istrator',
        email: 'admin@example.org',
        isAdmin: true,
    },
};

export interface Session {
    id: string;
    user: KnownUser | null;
    /** Serialized preferences as stored by `PUT /iam/v1/people/-home-/-me-/preferences`. */
    preferences: string;
}

const sessions = new Map<string, Session>();
let sessionCounter = 0;

function createSession(): Session {
    // Deterministic ids keep HAR dumps and logs diffable between runs.
    const id = `mock-session-${++sessionCounter}`;
    // The language is part of the user preferences; pinning it to "none" keeps the UI on raw
    // i18n keys for logged-in users too (see ../README.md).
    const session: Session = { id, user: null, preferences: '{"language":"none"}' };
    sessions.set(id, session);
    return session;
}

export function getSession(req: IncomingMessage): Session {
    const id = parseCookies(req)[SESSION_COOKIE];
    const existing = id ? sessions.get(id) : undefined;
    return existing ?? createSession();
}

/**
 * Resolves the `Authorization: Basic` header the frontend sets for exactly one request when
 * logging in (see `AuthenticationService.loginWithBasicAuth`).
 */
export function resolveBasicAuth(req: IncomingMessage): KnownUser | null | undefined {
    const header = req.headers.authorization;
    if (!header || !header.toLowerCase().startsWith('basic ')) {
        return undefined;
    }
    const credentials = Buffer.from(header.slice(6), 'base64').toString('utf8');
    return KNOWN_USERS[credentials] ?? null;
}

export function resetSessions(): void {
    sessions.clear();
    sessionCounter = 0;
}
