import { ServerResponse } from 'http';
import { DDB_JOB_ID, harnessCases } from '../fixtures/rs2-modules';
import { json, noContent } from '../http';
import { RenderDataResponse, JobInfoReply } from '../models';
import { Router } from '../router';

/**
 * Rendering service 2.
 *
 * RS2 is a separate service, not part of the edu-sharing REST API. In a non-production build
 * `RenderHelperService.prepareRootUrl()` pins its root to `/rendering2` (the dev proxy path), so
 * these routes live at the origin root next to `/edu-sharing`, not below it.
 *
 * The contract is the committed spec `projects/rendering-service-api/src/lib/api/openapi.json`.
 */

/**
 * The rendered result.
 *
 * - `jobId: null` plus `objectLinks` means "nothing to wait for": `RenderComponent` renders right
 *   away instead of starting a 500ms polling interval.
 * - `IMAGE` is the only deterministic module - video and audio mount media players, PDF mounts the
 *   pdf viewer, H5P/Moodle/url mount iframes.
 * - Exactly one link, because `ImageComponent.loadOptimalSize()` otherwise picks by container width.
 * - `AssetLinkPipe` cuts the link at `/public` and prepends the current root url, so the host part
 *   is irrelevant - only the `/public/...` path matters.
 */
const renderData: RenderDataResponse = {
    deferred: false,
    jobId: null,
    module: 'IMAGE',
    objectLinks: [
        { width: 800, height: 600, link: 'http://rs2.mock/public/asset?id=mock-image' },
    ],
};

const finishedJob: JobInfoReply = {
    status: 'FINISHED',
    module: 'IMAGE',
    jobs: [
        {
            quality: 1,
            progress: 100,
            status: 'FINISHED',
            objectLink: renderData.objectLinks![0],
        },
    ],
};

/**
 * Answers `renderdata` for the standalone harness: the requested node id selects the case, so the
 * harness needs no extra plumbing. `415` is a real answer here, not a gap - it is how the backend
 * says "no module for this media type" and how `RenderComponent` is sent to its frontend-module
 * fallback (`ModuleInfoService`).
 */
function harnessRenderData(res: ServerResponse, nodeId: string | undefined): boolean {
    const harnessCase = Object.values(harnessCases).find((entry) => entry.node.ref.id === nodeId);
    if (!harnessCase) {
        return false;
    }
    if (harnessCase.render === 415) {
        json(res, { error: 'UnsupportedMediaType', userMessage: 'NO_MODULE' }, 415);
    } else {
        json(res, harnessCase.render);
    }
    return true;
}

/**
 * The DDB job. `DdbComponent` picks the size closest to its container from the `size_*` entries and
 * substitutes the placeholders in `linkTemplate`; the result must be a link the mock can serve.
 */
const ddbJob: JobInfoReply = {
    status: 'FINISHED',
    module: 'DDB',
    jobs: [
        {
            quality: 1,
            progress: 100,
            status: 'FINISHED',
            objectLink: { width: 800, height: 600, link: 'http://rs2.mock/public/asset?id=ddb' },
            additionalData: {
                size_small: '400,300',
                size_large: '800,600',
                widthPlaceHolder: '{width}',
                heightPlaceHolder: '{height}',
                linkTemplate:
                    'http://127.0.0.1:4200/edu-sharing/preview/preview-3.png?w={width}&h={height}',
            },
        },
    ],
};

export function registerRendering2Routes(router: Router): void {
    router.post('/public/renderdata', ({ res, body }) => {
        if (!harnessRenderData(res, body?.nodeId)) {
            json(res, renderData);
        }
    });
    // The service worker re-requests the render data with GET when it warms its cache.
    router.get('/public/renderdata', ({ res, query }) => {
        if (!harnessRenderData(res, query.get('nodeId') ?? undefined)) {
            json(res, renderData);
        }
    });
    router.post('/public/renderdata/ondemand', ({ res }) => json(res, renderData));

    /**
     * Job status. Only requested when a `renderdata` answer carried a `jobId`; the harness uses
     * that for the DDB case, whose component needs `additionalData` - a field the no-job path
     * hardcodes to `undefined`.
     */
    router.get('/public/job', ({ res, query }) =>
        json(res, query.get('jobId') === DDB_JOB_ID ? ddbJob : finishedJob),
    );
    router.post('/public/job/refresh', ({ res }) => json(res, finishedJob));

    /** Frontend-module fallback, requested only when `renderdata` answers 415. */
    router.get('/public/modules', ({ res }) => json(res, []));

    router.put('/public/tracking', ({ res }) => noContent(res));
    router.delete('/public/session', ({ res }) => noContent(res));
    router.get('/ping', ({ res }) => json(res, { status: 'OK' }));
}
