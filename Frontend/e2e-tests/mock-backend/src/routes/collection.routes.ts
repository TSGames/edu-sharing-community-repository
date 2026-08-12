import { paginate } from '../fixtures/builders';
import { collectionReferences, collections, findCollection } from '../fixtures/collections';
import { json } from '../http';
import { Router } from '../router';

const EMPTY_PAGINATION = { total: 0, from: 0, count: 0 };

export function registerCollectionRoutes(router: Router): void {
    router.get(
        '/collection/v1/collections/:repository/:collection/children/collections',
        ({ res, params, query }) => {
            // Only the root level holds collections in this fixture set.
            const items = params.collection === '-root-' ? collections : [];
            const { page, pagination } = paginate(items, query);
            json(res, { collections: page, pagination });
        },
    );

    router.get(
        '/collection/v1/collections/:repository/:collection/children/references',
        ({ res, params, query }) => {
            const items = collectionReferences[params.collection] ?? [];
            const { page, pagination } = paginate(items, query);
            // `ReferenceEntries`, not `NodeEntries`: the key is `references`.
            json(res, { references: page, pagination });
        },
    );

    // Proposals are `NodeEntries` (`e.nodes.map(...)` in `collection-content.component`).
    router.get('/collection/v1/collections/:repository/:collection/children/proposals', ({ res }) =>
        json(res, { nodes: [], pagination: EMPTY_PAGINATION }),
    );

    router.get('/collection/v1/collections/:repository/children/proposals/collections', ({ res }) =>
        json(res, { collections: [], pagination: EMPTY_PAGINATION }),
    );

    router.get('/collection/v1/collections/:repository/:collectionId', ({ res, params }) => {
        const collection = findCollection(params.collectionId);
        if (!collection) {
            json(res, { error: 'NodeDoesNotExistException', message: params.collectionId }, 404);
            return;
        }
        json(res, { collection });
    });
}
