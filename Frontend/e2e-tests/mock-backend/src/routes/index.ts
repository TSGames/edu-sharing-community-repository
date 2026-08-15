import { Router } from '../router';
import { registerAboutRoutes } from './about.routes';
import { registerAuthenticationRoutes } from './authentication.routes';
import { registerCollectionRoutes } from './collection.routes';
import { registerConfigRoutes } from './config.routes';
import { registerIamRoutes } from './iam.routes';
import { registerMdsRoutes } from './mds.routes';
import { registerMiscRoutes } from './misc.routes';
import { registerNetworkRoutes } from './network.routes';
import { registerNodeRoutes } from './node.routes';
import { registerRendering2Routes } from './rendering2.routes';
import { registerSearchRoutes } from './search.routes';

/**
 * Builds the REST router. Paths are relative to `/edu-sharing/rest`.
 */
export function createApiRouter(): Router {
    const router = new Router();
    registerAboutRoutes(router);
    registerConfigRoutes(router);
    registerAuthenticationRoutes(router);
    registerIamRoutes(router);
    registerNetworkRoutes(router);
    registerMdsRoutes(router);
    registerSearchRoutes(router);
    registerNodeRoutes(router);
    registerCollectionRoutes(router);
    registerMiscRoutes(router);
    return router;
}

/**
 * Builds the router for rendering service 2. Paths are relative to `/rendering2`, which is where a
 * non-production build sends its RS2 requests (see `RenderHelperService.prepareRootUrl`).
 */
export function createRendering2Router(): Router {
    const router = new Router();
    registerRendering2Routes(router);
    return router;
}
