import { toolPermissions } from '../fixtures/user';
import { json, noContent, setCookie } from '../http';
import { PrimaryLogin } from '../models';
import { Router } from '../router';
import { KNOWN_USERS, KnownUser, resolveBasicAuth, SESSION_COOKIE } from '../session';
import { USER_HOME_ID } from '../fixtures/builders';

const SESSION_TIMEOUT_SECONDS = 3600;

function loggedIn(user: KnownUser): PrimaryLogin {
    return {
        isValidLogin: true,
        isGuest: false,
        isAdmin: user.isAdmin,
        sessionTimeout: SESSION_TIMEOUT_SECONDS,
        authorityName: user.userName,
        currentScope: null,
        statusCode: 'OK',
        toolPermissions,
        userHome: USER_HOME_ID,
        remoteAuthentications: {},
    };
}

const anonymous: PrimaryLogin = {
    isValidLogin: false,
    isGuest: false,
    isAdmin: false,
    sessionTimeout: 0,
    authorityName: 'guest',
    currentScope: null,
    statusCode: 'INVALID_CREDENTIALS',
    toolPermissions: [],
    remoteAuthentications: {},
};

export function registerAuthenticationRoutes(router: Router): void {
    /**
     * The login endpoint. The frontend sends `Authorization: Basic` for exactly one request
     * (`AuthenticationService.loginWithBasicAuth`); every later call relies on the session cookie.
     */
    router.get('/authentication/v1/validateSession', ({ req, res, session }) => {
        const basicAuth = resolveBasicAuth(req);
        if (basicAuth === null) {
            // Header present but credentials unknown — used by the invalid-login test.
            json(res, anonymous);
            return;
        }
        if (basicAuth) {
            session.user = basicAuth;
            setCookie(res, SESSION_COOKIE, session.id, SESSION_TIMEOUT_SECONDS);
            json(res, loggedIn(basicAuth));
            return;
        }
        json(res, session.user ? loggedIn(session.user) : anonymous);
    });

    router.get('/authentication/v1/destroySession', ({ res, session }) => {
        session.user = null;
        setCookie(res, SESSION_COOKIE, session.id, 0);
        noContent(res);
    });

    router.post('/authentication/v1/loginToScope', ({ res, body, session }) => {
        const credentials = `${body?.userName}:${body?.password}`;
        const user = KNOWN_USERS[credentials];
        if (!user) {
            json(res, anonymous);
            return;
        }
        session.user = user;
        setCookie(res, SESSION_COOKIE, session.id, SESSION_TIMEOUT_SECONDS);
        json(res, { ...loggedIn(user), currentScope: body?.scope ?? null });
    });

    router.get('/authentication/v1/hasAccessToScope', ({ res }) => json(res, { hasAccess: false }));
    router.get('/authentication/v1/oauth2consent', ({ res }) => json(res, {}));
}
