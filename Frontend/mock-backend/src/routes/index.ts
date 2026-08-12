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
