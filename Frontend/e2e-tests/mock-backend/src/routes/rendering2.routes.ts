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

export function registerRendering2Routes(router: Router): void {
    router.post('/public/renderdata', ({ res }) => json(res, renderData));
    router.post('/public/renderdata/ondemand', ({ res }) => json(res, renderData));

    // Only reached when a response carries a `jobId`; kept so a stray call is not a 501.
    router.get('/public/job', ({ res }) => json(res, finishedJob));
    router.post('/public/job/refresh', ({ res }) => json(res, finishedJob));

    /** Frontend-module fallback, requested only when `renderdata` answers 415. */
    router.get('/public/modules', ({ res }) => json(res, []));

    router.put('/public/tracking', ({ res }) => noContent(res));
    router.delete('/public/session', ({ res }) => noContent(res));
    router.get('/ping', ({ res }) => json(res, { status: 'OK' }));
}
