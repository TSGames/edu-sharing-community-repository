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
    // Keep both empty: every plugin/feature the frontend discovers here pulls in further
    // endpoints (suggestions, rendering service 2, b-api, ...) that this mock does not serve.
    features: [],
    plugins: [],
    themesUrl: '/edu-sharing/themes/default',
    lastCacheUpdate: 0,
};
