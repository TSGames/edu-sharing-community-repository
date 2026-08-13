import { about } from '../fixtures/about';
import { json, text } from '../http';
import { Router } from '../router';

export function registerAboutRoutes(router: Router): void {
    router.get('/_about', ({ res }) => json(res, about));
    router.get('/_about/status/:mode', ({ res }) => text(res, 'OK'));
    router.get('/_about/health/liveness', ({ res }) => text(res, 'OK'));
    router.get('/_about/health/readiness', ({ res }) => text(res, 'OK'));
    /**
     * `Licenses` as consumed by `ThirdPartyLicensesDialogComponent`: `repository` and `services`
     * are dereferenced without a guard, and `services` is a map of maps.
     */
    router.get('/_about/licenses', ({ res }) =>
        json(res, {
            repository: {
                '@angular/core.txt': 'MIT License - Copyright (c) 2010-2024 Google LLC',
                'rxjs.txt': 'Apache License 2.0',
            },
            services: {
                rendering: {
                    'pdfjs.txt': 'Apache License 2.0',
                },
            },
        }),
    );
}
