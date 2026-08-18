import { paginate } from '../fixtures/builders';
import { collections } from '../fixtures/collections';
import { files, savedSearches } from '../fixtures/nodes';
import { json } from '../http';
import { Facet, Node, SearchResultNode } from '../models';
import { Ctx, Router } from '../router';

const facets: Facet[] = [
    {
        property: 'ccm:educationalcontext',
        sumOtherDocCount: 0,
        values: [
            { value: 'sonstiges', count: files.length, displayString: 'Sonstiges' },
            { value: 'sekundarstufe_1', count: 4, displayString: 'Sekundarstufe I' },
        ],
    },
];

/**
 * Applies the free-text criterion of the search request to the fixed corpus.
 *
 * Matching on the title only is enough to make "search for X" scenarios meaningful while keeping
 * results fully predictable.
 */
function applyCriteria(body: any, corpus: Node[]): Node[] {
    const criteria: { property?: string; values?: string[] }[] = body?.criteria ?? [];
    const searchWord = criteria
        .find((criterion) => criterion.property === 'ngsearchword')
        ?.values?.[0]?.trim()
        .toLowerCase();
    if (!searchWord) {
        return corpus;
    }
    return corpus.filter((node) => (node.title ?? '').toLowerCase().includes(searchWord));
}

function search({ res, params, query, body }: Ctx): void {
    // The saved-searches dialog searches the shared saved searches through the same endpoint,
    // distinguished only by the query id.
    const corpus = params.query === 'saved_search' ? savedSearches : files;
    const matches = applyCriteria(body, corpus);
    const { page, pagination } = paginate(matches, query, 10);
    const result: SearchResultNode = { nodes: page, pagination, facets, ignored: [] };
    json(res, result);
}

export function registerSearchRoutes(router: Router): void {
    router.post('/search/v1/queries/:repository/:metadataset/:query', search);
    router.post('/search/v1/queries/:repository/:metadataset/:query/facets', ({ res }) =>
        json(res, { facets }),
    );
    router.post('/search/v1/queries/:repository/:metadataset/:query/lrmi', search);
    router.get('/search/v1/custom/:repository', ({ res, query }) => {
        const { page, pagination } = paginate(files, query, 10);
        json(res, { nodes: page, pagination, facets: [] });
    });

    const emptyResult: SearchResultNode = {
        nodes: [],
        pagination: { total: 0, from: 0, count: 0 },
        facets: [],
    };
    router.post('/search/v1/user/recent/:repository', ({ res }) => json(res, emptyResult));
    router.post('/search/v1/user/shares/:repository', ({ res }) => json(res, emptyResult));
    router.get('/search/v1/relevant/:repository', ({ res }) => json(res, emptyResult));

    /** Collections tab of the search page. */
    router.get('/collection/v1/collections/:repository/search', ({ res, query }) => {
        const { page, pagination } = paginate(collections, query, 10);
        json(res, { collections: page, pagination });
    });
}
