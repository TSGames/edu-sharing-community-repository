import { repositories } from '../fixtures/user';
import { json } from '../http';
import { Router } from '../router';

export function registerNetworkRoutes(router: Router): void {
    router.get('/network/v1/repositories', ({ res }) => json(res, repositories));
    router.get('/network/v1/services', ({ res }) => json(res, { services: [] }));
    router.get('/network/v1/service', ({ res }) => json(res, {}));
}
