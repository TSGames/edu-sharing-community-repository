import { userEntry } from '../fixtures/user';
import { json, noContent } from '../http';
import { Router } from '../router';
import { KNOWN_USERS } from '../session';

const GUEST = KNOWN_USERS['e2e:e2e'];

export function registerIamRoutes(router: Router): void {
    router.get('/iam/v1/people/:repository/:person', ({ res, session }) =>
        json(res, userEntry(session.user ?? GUEST)),
    );

    router.get('/iam/v1/people/:repository/:person/preferences', ({ res, session }) =>
        json(res, { preferences: session.preferences }),
    );

    router.put('/iam/v1/people/:repository/:person/preferences', ({ res, body, session }) => {
        session.preferences = typeof body === 'string' ? body : JSON.stringify(body ?? {});
        noContent(res);
    });

    router.get('/iam/v1/people/:repository/:person/profileSettings', ({ res }) =>
        json(res, { showEmail: false }),
    );

    router.get('/iam/v1/people/:repository/:person/stats', ({ res }) =>
        json(res, { nodeCount: 0, collectionCount: 0 }),
    );

    router.get('/iam/v1/people/:repository/:person/memberships', ({ res }) =>
        json(res, { groups: [], pagination: { total: 0, from: 0, count: 0 } }),
    );

    router.get('/iam/v1/people/:repository/:person/dashboard/shortcuts', ({ res }) =>
        json(res, { shortcuts: [] }),
    );

    /** Favourites and other node lists — empty, the flows under test do not depend on them. */
    router.get('/iam/v1/people/:repository/:person/nodeList/:list', ({ res }) =>
        json(res, { nodes: [], pagination: { total: 0, from: 0, count: 0 } }),
    );

    router.get('/iam/v1/people/:repository/:person/dataprotection', ({ res }) => json(res, {}));

    router.get('/iam/v1/people/:repository', ({ res }) =>
        json(res, { users: [], pagination: { total: 0, from: 0, count: 0 } }),
    );
}
