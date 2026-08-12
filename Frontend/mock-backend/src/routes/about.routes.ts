import { about } from '../fixtures/about';
import { json, text } from '../http';
import { Router } from '../router';

export function registerAboutRoutes(router: Router): void {
    router.get('/_about', ({ res }) => json(res, about));
    router.get('/_about/status/:mode', ({ res }) => text(res, 'OK'));
    router.get('/_about/health/liveness', ({ res }) => text(res, 'OK'));
    router.get('/_about/health/readiness', ({ res }) => text(res, 'OK'));
    router.get('/_about/licenses', ({ res }) => json(res, {}));
}
