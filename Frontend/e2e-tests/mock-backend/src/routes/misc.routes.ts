import { organizations } from '../fixtures/authorities';
import { nodeStatisticsOf, relationsOf, usagesOf } from '../fixtures/node-extras';
import { collections } from '../fixtures/collections';
import { findNode } from '../fixtures/nodes';
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
    // `GET /relation/v1/{repository}/{node}` returns a bare array of `NodeRelationData`, not a
    // wrapper object - see `api/fn/relation-v-1/get-relations.ts`.
    router.get('/relation/v1/:repository/:node', ({ res, params }) => {
        const node = findNode(params.node);
        json(res, node ? relationsOf(node) : []);
    });
    router.get('/relation/v1/:repository/:node/raw', ({ res }) => json(res, []));
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
        json(res, organizations),
    );
    /**
     * Usages and statistics - the "views and usage" panel of the editorial sidebar.
     *
     * `…/collections` answers with entries carrying the collection under `collection`; the
     * generated client types it loosely as `Collection[]`, the runtime shape is what counts here.
     * Only `ACTIVE` entries are rendered.
     */
    router.get('/usage/v1/usages/node/:nodeId', ({ res, params }) => {
        const node = findNode(params.nodeId);
        json(res, { usages: node ? usagesOf(node) : [] });
    });
    router.get('/usage/v1/usages/node/:nodeId/collections', ({ res }) =>
        json(
            res,
            collections.map((collection) => ({ collection, collectionUsageType: 'ACTIVE' })),
        ),
    );
    router.delete('/usage/v1/usages/node/:nodeId/:usageId', ({ res }) => noContent(res));

    /** A bare array of tracking entries - see `api/fn/statistic-v-1/get-by-nodes.ts`. */
    router.post('/statistic/v1/statistics/nodes/range', ({ res, body }) =>
        json(res, nodeStatisticsOf(Array.isArray(body) ? body : [])),
    );

    router.get('/mediacenter/v1/mediacenter/:repository', ({ res }) => json(res, []));
    router.get('/register/v1/exists/:mail', ({ res }) => json(res, { exists: false }));
    router.get('/stream/v1/:repository', ({ res }) =>
        json(res, { stream: [], pagination: { total: 0, from: 0, count: 0 } }),
    );
}
