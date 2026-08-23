import { Config, Language, Values, Variables } from '../models';

/**
 * Client configuration.
 *
 * Deliberately lean: the frontend falls back to sensible defaults for missing keys
 * (`ConfigurationService.get(key, fallback)`), while every feature switched *on* here would pull
 * in additional REST endpoints and non-deterministic UI (banners, tutorials, ratings).
 */
const values: Values = {
    // Where `StartupComponent` sends the user after login (non-production build).
    defaultLocation: 'workspace',
    loginDefaultLocation: 'workspace',
    supportedLanguages: ['de', 'en'],
    siteTitle: 'edu-sharing (Mock)',
    branding: false,
    loginAllowLocal: true,
    itemsPerRequest: 25,
    // 0 = list/table view: deterministic row heights, better suited for pixel baselines than cards.
    searchViewType: 0,
    workspaceViewType: 0,
    searchSidenavMode: 'never',
    searchGroupResults: false,
    // Gates the "report this material" entry of the search-page context menu.
    nodeReport: true,
    publishingNotice: false,
    licenseDialogOnUpload: false,
    userAffiliation: false,
    editProfile: false,
    workspaceColumns: ['cclom:title', 'cm:modified', 'ccm:commonlicense_key'],
    /**
     * Third-party embeddings the `url` module of rendering service 2 must ask consent for. When a
     * node's `ccm:wwwurl` matches one of these patterns, the module renders its consent overlay
     * instead of the external iframe (`GdprService`) - which is both the privacy-compliant state
     * and the only one that renders without reaching a third-party host.
     */
    gdpr: {
        enabled: true,
        entry: [
            {
                regex: '.*youtube\\.com.*|.*youtu\\.be.*',
                name: 'YouTube',
                ref: 'https://policies.google.com/privacy',
            },
            {
                regex: '.*vimeo\\.com.*',
                name: 'Vimeo',
                ref: 'https://vimeo.com/privacy',
            },
        ],
    },
    rating: { mode: 'none' },
    register: { local: false, recoverPassword: false },
    stream: { enabled: false },
    upload: { postDialog: { license: false } },
    frontpage: { enabled: false },
    collections: { scopes: ['MY'] },
    mainnav: {
        icon: null,
        title: 'edu-sharing (Mock)',
        currentScope: null,
        // 'dropdown' puts the info entries (e.g. LICENSE_INFORMATION) into the user menu on
        // desktop as well; with 'sidebar' they carry a max-width media query and only appear on
        // small screens.
        mainMenuStyle: 'dropdown',
    },
};

export const clientConfig: Config = {
    current: values,
    global: values,
    contextId: null,
};

export const variables: Variables = {
    current: {},
    global: {},
};

/**
 * Translation *overrides*. The mock is served from a non-production build, so the frontend loads
 * its dictionaries from `assets/i18n` and only asks the backend for overrides — an empty object is
 * both correct and keeps the fixture small.
 */
export const language: Language = {
    current: {},
    global: {},
    currentLanguage: 'de',
};

export const languageDefaults: { [key: string]: string } = {};
