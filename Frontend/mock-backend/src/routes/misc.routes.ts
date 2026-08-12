import { toolPermissions } from '../fixtures/user';
import { json, noContent } from '../http';
import { Router } from '../router';

/**
 * Endpoints that are polled by the shell (bell, banners, tracking) but carry no content relevant
 * to the flows under test. They answer empty so no error toast appears in a screenshot.
 */
export function registerMiscRoutes(router: Router): void {
    router.get('/notification/v1/notifications', ({ res }) =>
        json(res, { content: [], pagination: { total: 0, from: 0, count: 0 } }),
    );
    router.get('/notification/v1/notifications/:repository', ({ res }) =>
        json(res, { content: [], pagination: { total: 0, from: 0, count: 0 } }),
    );
    router.put('/notification/v1/notifications/status/:status', ({ res }) => noContent(res));

    router.get('/rating/v1/ratings/:repository/:node/history', ({ res }) => json(res, []));
    router.get('/usage/v1/usages/node/:node', ({ res }) => json(res, { usages: [] }));
    router.get('/usage/v1/usages/node/:node/collections', ({ res }) => json(res, []));
    router.get('/relation/v1/relation/:repository/:node', ({ res }) => json(res, { relations: [] }));
    router.get('/comment/v1/comments/:repository/:node', ({ res }) => json(res, { comments: [] }));

    router.get('/admin/v1/toolpermissions/:authority', ({ res }) =>
        json(
            res,
            Object.fromEntries(
                toolPermissions.map((permission) => [
                    permission,
                    { explicit: 'ALLOWED', effective: 'ALLOWED' },
                ]),
            ),
        ),
    );

    router.get('/ltiplatform/v13/tools', ({ res }) => json(res, []));
    router.get('/connector/v1/connectors/:repository/list', ({ res }) =>
        json(res, { url: null, connectors: [] }),
    );
    router.get('/organization/v1/organizations/:repository', ({ res }) =>
        json(res, { organizations: [], pagination: { total: 0, from: 0, count: 0 } }),
    );
    router.get('/mediacenter/v1/mediacenter/:repository', ({ res }) => json(res, []));
    router.get('/register/v1/exists/:mail', ({ res }) => json(res, { exists: false }));
    router.get('/stream/v1/:repository', ({ res }) =>
        json(res, { stream: [], pagination: { total: 0, from: 0, count: 0 } }),
    );
}
