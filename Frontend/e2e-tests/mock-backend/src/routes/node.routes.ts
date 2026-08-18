import { paginate, USER_HOME_ID } from '../fixtures/builders';
import { nodePermissions } from '../fixtures/authorities';
import { childrenOf, findNode, userHomeFolder } from '../fixtures/nodes';
import { json, noContent } from '../http';
import { Node } from '../models';
import { Router } from '../router';

/** Virtual node ids the workspace side tabs use; all of them are empty in the mock. */
const EMPTY_VIRTUAL_FOLDERS = [
    '-inbox-',
    '-shared_files-',
    '-to_me_shared_files-',
    '-my_shared_files-',
    '-to_me_shared_files_personal-',
    '-saved_search-',
    '-workflow_receive-',
];

export function registerNodeRoutes(router: Router): void {
    router.get('/node/v1/nodes/:repository/:node/children', ({ res, params, query }) => {
        if (EMPTY_VIRTUAL_FOLDERS.includes(params.node)) {
            json(res, { nodes: [], pagination: { total: 0, from: 0, count: 0 } });
            return;
        }
        // The workspace tree requests `filter=folders`; without honouring it, files show up
        // as tree nodes.
        const filter = query.getAll('filter');
        let children = childrenOf(params.node);
        if (filter.includes('folders')) {
            children = children.filter((node) => node.isDirectory);
        } else if (filter.includes('files')) {
            children = children.filter((node) => !node.isDirectory);
        }
        const { page, pagination } = paginate(children, query);
        json(res, { nodes: page, pagination });
    });

    router.get('/node/v1/nodes/:repository/:node/metadata', ({ res, params }) => {
        const node = findNode(params.node);
        if (!node) {
            json(res, { error: 'NodeDoesNotExistException', message: params.node }, 404);
            return;
        }
        json(res, { node });
    });

    /**
     * Signed metadata for rendering service 2. The signature is never verified by the frontend, it
     * only forwards the values in the `renderdata` request body.
     */
    router.get('/node/v1/nodes/:repository/:node/metadata/secured', ({ res, params }) => {
        const node = findNode(params.node);
        if (!node) {
            json(res, { error: 'NodeDoesNotExistException', message: params.node }, 404);
            return;
        }
        json(res, {
            node,
            jwt: 'mock-jwt',
            signedNode: 'e30=',
            signature: 'mock-signature',
            signatureAlgorithm: 'SHA256withRSA',
        });
    });

    router.get('/node/v1/nodes/:repository/:node/parents', ({ res, params }) => {
        const node = findNode(params.node);
        const parents: Node[] =
            !node || node.ref.id === USER_HOME_ID ? [userHomeFolder] : [userHomeFolder];
        json(res, { nodes: parents, scope: 'MY_FILES' });
    });

    // Populated on purpose - the share dialog renders this list as its "invited" tab.
    router.get('/node/v1/nodes/:repository/:node/permissions', ({ res }) =>
        json(res, nodePermissions),
    );

    /** Permissions of a single authority; the share dialog checks the configured receiver. */
    router.get('/node/v1/nodes/:repository/:node/permissions/:authority', ({ res }) =>
        json(res, ['Coordinator']),
    );

    router.get('/node/v1/nodes/:repository/:node/shares', ({ res }) => json(res, []));
    router.get('/node/v1/nodes/:repository/:node/versions', ({ res }) => json(res, { versions: [] }));
    router.get('/node/v1/nodes/:repository/:node/comments', ({ res }) => json(res, { comments: [] }));
    // `NodeStats.total` is dereferenced without a guard by the collection info bar.
    router.get('/node/v1/nodes/:repository/:node/stats', ({ res }) =>
        json(res, {
            total: {
                VIEW_COLLECTION: 0,
                VIEW_MATERIAL: 0,
                DOWNLOAD_MATERIAL: 0,
                VIEW_MATERIAL_EMBEDDED: 0,
            },
        }),
    );

    router.get('/rendering/v1/details/:repository/:node', ({ res, params }) => {
        const node = findNode(params.node);
        json(res, { detailsSnippet: '<div class="mock-rendering"></div>', node: node ?? null });
    });
    router.get('/rendering/v1/applications', ({ res }) => json(res, []));

    router.put('/tracking/v1/tracking/:repository/:event', ({ res }) => noContent(res));
    router.put('/tracking/v1/tracking/:repository/:node/:event', ({ res }) => noContent(res));
}
