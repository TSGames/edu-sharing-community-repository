import {
    clientConfig,
    language,
    languageDefaults,
    variables,
} from '../fixtures/config-values';
import { json } from '../http';
import { Router } from '../router';

export function registerConfigRoutes(router: Router): void {
    router.get('/config/v1/values', ({ res }) => json(res, clientConfig));
    router.get('/config/v1/variables', ({ res }) => json(res, variables));
    router.get('/config/v1/messages', ({ res }) => json(res, []));
    router.get('/config/v1/language', ({ res }) => json(res, language));
    router.get('/config/v1/language/defaults', ({ res }) => json(res, languageDefaults));
    router.get('/config/v1/context', ({ res }) => json(res, {}));
    router.get('/config/v1/dynamic/:key', ({ res }) => json(res, { value: null }));
}
