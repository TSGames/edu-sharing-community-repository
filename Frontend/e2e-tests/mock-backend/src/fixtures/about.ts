import { About } from '../models';

const version = { major: 11, minor: 0, repository: '11.0.0-MOCK' };

export const about: About = {
    version,
    services: [
        {
            name: 'MOCK',
            instances: [{ endpoint: '/edu-sharing/rest', version }],
        },
    ],
    features: [],
    // `rendering-service-2` makes `RenderMainPageComponent` load the render2 page instead of the
    // legacy renderer; `renderingService2.url` must be a non-null object or `prepareRootUrl()`
    // throws. In a non-production build the url itself is unused - the requests go to the dev
    // proxy path `/rendering2`, which this mock serves at the origin root.
    // Any further plugin would pull in endpoints this mock does not serve.
    plugins: [{ id: 'rendering-service-2' }],
    renderingService2: { url: 'http://127.0.0.1:4200/rendering2' },
    themesUrl: '/edu-sharing/themes/default',
    lastCacheUpdate: 0,
};
