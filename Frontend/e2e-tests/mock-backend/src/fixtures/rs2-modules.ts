import { Node, ObjectLink, RenderDataResponse } from '../models';
import { makeFile } from './builders';

/**
 * Fixtures for the standalone rendering-service-2 harness (`/rs2-harness?module=...`).
 *
 * RS2 picks its module through two independent mechanisms, and the harness exercises both:
 *
 * 1. the **backend module** - `POST /public/renderdata` answers with `module` and
 *    `RenderComponent` dispatches on it (`render.component.html`). One field decides everything.
 * 2. the **frontend module** - when the backend answers **415** ("no module for this media type"),
 *    `RenderComponent` falls back to `ModuleInfoService.getFrontendModuleSetting(node)`, which
 *    classifies the node purely client-side from `ccm:wwwurl`, `mimetype`, `mediatype`,
 *    `remote.repository.repositoryType` and aspects. No backend is involved at all.
 *
 * Every asset link is rewritten by `AssetLinkPipe` (it cuts the link at `/public` and prepends the
 * current RS2 root), so the host below is irrelevant - all media and images stay same-origin.
 */

const RS2_ORIGIN = 'http://rs2.mock';

function link(asset: string, width = 800, height = 600): ObjectLink {
    return { width, height, link: `${RS2_ORIGIN}/public/asset?id=${asset}` };
}

/** Job id of the one harness case that uses the job (polling) path. */
export const DDB_JOB_ID = 'mock-ddb-job';

/** `jobId: null` plus `objectLinks` means "nothing to wait for" - no polling, no spinner. */
function finished(module: string, objectLinks: ObjectLink[]): RenderDataResponse {
    return { deferred: false, jobId: null, module, objectLinks };
}

function node(options: {
    id: string;
    title: string;
    mimetype?: string;
    mediatype?: string;
    properties?: { [key: string]: string[] };
    remoteRepositoryType?: string;
}): Node {
    const base = makeFile({
        id: options.id,
        name: options.title,
        title: options.title,
        mimetype: options.mimetype,
        mediatype: options.mediatype,
    });
    return {
        ...base,
        properties: { ...base.properties, ...(options.properties ?? {}) },
        ...(options.remoteRepositoryType
            ? { remote: { id: 'external-id', repository: { repositoryType: options.remoteRepositoryType } } }
            : {}),
    };
}

export interface HarnessCase {
    /** Node handed to the web component, base64-encoded into its `encoded_node` attribute. */
    node: Node;
    /** RS2 answer, or `415` to force the frontend-module fallback. */
    render: RenderDataResponse | 415;
    /** Short label rendered above the component so a screenshot names what it shows. */
    label: string;
}

export const harnessCases: { [key: string]: HarnessCase } = {
    image: {
        label: 'IMAGE (backend module)',
        node: node({
            id: '00000000-0000-4000-c000-000000000001',
            title: 'Wasserkreislauf als Bild',
            mimetype: 'image/png',
            mediatype: 'file-image',
        }),
        render: finished('IMAGE', [link('image')]),
    },
    /**
     * Two links of different height, so the component offers its resolution menu
     * (`hasMultipleResolutions`) rather than a bare player.
     */
    video: {
        label: 'VIDEO (backend module)',
        node: node({
            id: '00000000-0000-4000-c000-000000000002',
            title: 'Wasserkreislauf als Video',
            mimetype: 'video/mp4',
            mediatype: 'file-video',
        }),
        render: finished('VIDEO', [link('video-720', 1280, 720), link('video-360', 640, 360)]),
    },
    audio: {
        label: 'AUDIO (backend module)',
        node: node({
            id: '00000000-0000-4000-c000-000000000003',
            title: 'Wasserkreislauf als Audio',
            mimetype: 'audio/mpeg',
            mediatype: 'file-audio',
        }),
        render: finished('AUDIO', [link('audio')]),
    },
    /**
     * The only case that goes through the **job** path: `DdbComponent` builds its image url from
     * `items[0].additionalData`, and `handleRenderingResponseWithoutJob` hardcodes that field to
     * `undefined`. Only the job replies carry it - so a `jobId` is required, which also makes this
     * the one case that exercises the polling branch of `RenderComponent`.
     */
    ddb: {
        label: 'DDB (backend module, job path)',
        node: node({
            id: '00000000-0000-4000-c000-000000000004',
            title: 'Deutsche Digitale Bibliothek',
            mimetype: 'image/jpeg',
            mediatype: 'file-image',
            remoteRepositoryType: 'ddb',
        }),
        render: { deferred: false, jobId: DDB_JOB_ID, module: 'DDB', objectLinks: [link('ddb')] },
    },
    /** `publicErrorMessage` is what the error module renders below its generic heading. */
    error: {
        label: 'ERROR (backend module)',
        node: node({
            id: '00000000-0000-4000-c000-000000000005',
            title: 'Fehlerhaftes Material',
        }),
        render: { deferred: false, jobId: null, module: 'ERROR', objectLinks: [] },
    },
    /** Frontend fallback for a node that is neither a url nor a known media type. */
    default: {
        label: 'default (frontend fallback)',
        node: node({
            id: '00000000-0000-4000-c000-000000000006',
            title: 'Unbekannter Dateityp',
            mimetype: 'application/octet-stream',
            mediatype: 'file',
        }),
        render: 415,
    },
    /**
     * The `url` module. All of these reach it through the 415 fallback and differ only in the
     * node's properties - `checkUrlModule` derives the `UrlEmbeddings` value from them.
     *
     * YouTube and Vimeo would embed a third-party iframe; the mock's client config declares them
     * in `gdpr.entry`, so the component renders its **consent overlay** instead - the state a
     * privacy-compliant deployment actually shows, and the only one that works without network.
     */
    'url-youtube': {
        label: 'url / YOUTUBE (GDPR consent)',
        node: node({
            id: '00000000-0000-4000-c000-000000000007',
            title: 'Der Wasserkreislauf erklärt',
            mimetype: 'text/html',
            mediatype: 'link',
            properties: { 'ccm:wwwurl': ['https://www.youtube.com/watch?v=mockVideoId'] },
        }),
        render: 415,
    },
    'url-vimeo': {
        label: 'url / VIMEO (GDPR consent)',
        node: node({
            id: '00000000-0000-4000-c000-000000000008',
            title: 'Wasserkreislauf (Vimeo)',
            mimetype: 'text/html',
            mediatype: 'link',
            properties: { 'ccm:wwwurl': ['https://vimeo.com/123456789'] },
        }),
        render: 415,
    },
    /** No embedding: preview image plus a link button, entirely offline. */
    'url-link': {
        label: 'url / LINK',
        node: node({
            id: '00000000-0000-4000-c000-000000000009',
            title: 'Materialsammlung Wasser',
            mimetype: 'text/html',
            mediatype: 'link',
            properties: { 'ccm:wwwurl': ['https://example.org/materialsammlung'] },
        }),
        render: 415,
    },
    /**
     * Audio embedding: detected from the node's `audio/*` mime type plus a url, and rendered as a
     * player pointing straight at that url - so it stays same-origin.
     *
     * There is deliberately no IMAGE case: that branch of the module binds `[ngSrc]` without the
     * `width`/`height` (or `fill`) that `NgOptimizedImage` requires, so it throws NG02954 and
     * renders an empty box. Adding a case would only pin that bug into a baseline.
     */
    'url-audio': {
        label: 'url / AUDIO',
        node: node({
            id: '00000000-0000-4000-c000-00000000000a',
            title: 'Wasserkreislauf (verlinktes Audio)',
            mimetype: 'audio/wav',
            mediatype: 'file-audio',
            properties: { 'ccm:wwwurl': ['/edu-sharing/mock-media/sample.wav'] },
        }),
        render: 415,
    },
};

export const harnessModules = Object.keys(harnessCases);
