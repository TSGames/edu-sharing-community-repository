import { defaultMds, mdsEntries } from '../fixtures/mds';
import { json } from '../http';
import { Router } from '../router';

export function registerMdsRoutes(router: Router): void {
    router.get('/mds/v1/metadatasets/:repository', ({ res }) => json(res, mdsEntries));

    router.get('/mds/v1/metadatasets/:repository/:metadataset', ({ res }) => json(res, defaultMds));

    /** Suggestion values for search widgets — the fixed valuespace, filtered by the query. */
    router.post('/mds/v1/metadatasets/:repository/:metadataset/values', ({ res, body }) => {
        const widgetId: string | undefined = body?.property ?? body?.widget;
        const query: string = (body?.query ?? body?.valueParameters?.query ?? '')
            .toString()
            .toLowerCase();
        const widget = defaultMds.widgets.find((candidate) => candidate.id === widgetId);
        const values = (widget?.values ?? []).filter(
            (value) => !query || value.caption.toLowerCase().includes(query),
        );
        json(res, { values: values.map((value) => ({ ...value, count: 1 })) });
    });
}
