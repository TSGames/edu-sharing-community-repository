/**
 * Structural types mirroring the edu-sharing REST schemas that this mock implements.
 *
 * These are deliberately hand-written instead of importing the generated models from
 * `ngx-edu-sharing-api`: the generated client only exists after `npm run prebuild`, and the mock
 * backend must be compilable (and runnable) on its own, e.g. for local UI work without any
 * backend at all.
 *
 * They mirror `Backend/services/rest/api/src/main/resources/openapi.json`; required properties of
 * the corresponding schema are required here as well, so a fixture that omits one fails `tsc`.
 * See `mock-backend/README.md` for how to check fixtures against the generated models.
 */

export interface ServiceVersion {
    major: number;
    minor: number;
    repository?: string;
    renderservice?: string;
}

export interface AboutService {
    name: string;
    instances: { endpoint: string; version: ServiceVersion }[];
}

export interface About {
    version: ServiceVersion;
    services: AboutService[];
    features?: { id: string }[];
    plugins?: { id: string }[];
    themesUrl?: string;
    lastCacheUpdate?: number;
}

export interface Values {
    [key: string]: unknown;
}

export interface Config {
    current?: Values;
    global?: Values;
    contextId?: string | null;
    language?: Language;
}

export interface Variables {
    current?: { [key: string]: unknown };
    global?: { [key: string]: unknown };
}

export interface Language {
    current?: { [key: string]: string };
    global?: { [key: string]: string };
    currentLanguage?: string;
}

export interface PrimaryLogin {
    isValidLogin: boolean;
    isGuest: boolean;
    isAdmin: boolean;
    sessionTimeout: number;
    authorityName?: string;
    currentScope?: string | null;
    statusCode?: string;
    toolPermissions?: string[];
    userHome?: string;
    remoteAuthentications?: { [key: string]: unknown };
}

export interface NodeRef {
    id: string;
    repo: string;
    archived: boolean;
    isHomeRepo?: boolean;
}

export interface UserProfile {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string | null;
    about?: string;
    primaryAffiliation?: string;
}

export interface Person {
    firstName?: string;
    lastName?: string;
    mailbox?: string;
    profile?: UserProfile;
}

export interface User {
    authorityName: string;
    authorityType?: string;
    userName?: string;
    profile?: UserProfile;
    homeFolder?: NodeRef;
    sharedFolders?: NodeRef[];
    organizations?: unknown[];
    quota?: { enabled: boolean; sizeQuota?: number; sizeCurrent?: number };
    editable?: boolean;
    status?: { status: string; date: number };
    properties?: { [key: string]: string[] };
}

export interface UserEntry {
    person: User;
    editProfile?: boolean;
}

export interface Preferences {
    preferences?: string;
}

export interface Repo {
    id?: string;
    title?: string;
    icon?: string;
    logo?: string;
    isHomeRepo?: boolean;
    repositoryType?: string;
    renderingSupported?: boolean;
}

export interface RepoEntries {
    repositories: Repo[];
}

export interface MetadataSetInfo {
    id: string;
    name: string;
    label?: string;
}

export interface MdsEntries {
    metadatasets: MetadataSetInfo[];
}

export interface MdsColumn {
    id: string;
    format?: string;
    showDefault?: boolean;
}

export interface MdsList {
    id?: string;
    columns?: { [group: string]: MdsColumn[] };
}

export interface MdsWidget {
    id?: string;
    caption?: string;
    type?: string;
    icon?: string;
    values?: { id: string; caption: string }[];
    isSearchable?: boolean;
    hasValues?: boolean;
    placeholder?: string;
}

export interface MdsView {
    id?: string;
    caption?: string;
    icon?: string;
    html?: string;
    rel?: string;
    isExtended?: boolean;
    hideIfEmpty?: boolean;
}

export interface MdsGroup {
    id?: string;
    rendering?: string;
    views?: string[];
}

export interface MdsSortColumn {
    id: string;
    mode?: string;
}

export interface MdsSort {
    id: string;
    columns?: MdsSortColumn[];
    default?: { sortBy: string; sortAscending: boolean };
    defaultSearch?: { sortBy: string; sortAscending: boolean };
}

export interface Mds {
    id: string;
    name: string;
    lists: MdsList[];
    widgets: MdsWidget[];
    views: MdsView[];
    groups: MdsGroup[];
    sorts: MdsSort[];
}

export interface Preview {
    url: string;
    width: number;
    height: number;
    isIcon: boolean;
    isGenerated?: boolean;
    mimetype?: string;
    type?: string;
}

export interface Collection {
    title: string;
    type: string;
    level0: boolean;
    fromUser: boolean;
    description?: string;
    color?: string;
    scope?: string;
    viewtype?: string;
    orderMode?: string;
    orderAscending?: boolean;
    pinned?: boolean;
    childCollectionsCount?: number;
    childReferencesCount?: number;
    owner?: User;
}

export interface Node {
    ref: NodeRef;
    name: string;
    createdAt: string;
    createdBy: Person;
    owner: Person;
    access: string[];
    parent?: NodeRef;
    title?: string;
    type?: string;
    aspects?: string[];
    isDirectory?: boolean;
    mimetype?: string;
    mediatype?: string;
    metadataset?: string;
    repositoryType?: string;
    size?: string;
    modifiedAt?: string;
    modifiedBy?: Person;
    iconURL?: string;
    icon?: { name?: string; color?: string };
    preview?: Preview;
    content?: { url?: string; version?: string; hash?: string };
    license?: { icon?: string; url?: string };
    collection?: Collection;
    properties?: { [key: string]: string[] };
    usedInCollections?: Node[];
    commentCount?: number;
    isPublic?: boolean;
    rating?: unknown;
    relations?: { [key: string]: unknown };
}

export interface Pagination {
    total: number;
    from: number;
    count: number;
}

export interface NodeEntries {
    nodes: Node[];
    pagination: Pagination;
}

export interface NodeEntry {
    node: Node;
}

export interface ParentEntries {
    nodes: Node[];
    scope?: string;
}

export interface FacetValue {
    value: string;
    count: number;
    displayString?: string;
}

export interface Facet {
    property: string;
    values: FacetValue[];
    sumOtherDocCount?: number;
}

export interface SearchResultNode {
    nodes: Node[];
    pagination: Pagination;
    facets: Facet[];
    ignored?: string[];
}

export interface CollectionEntries {
    collections: Node[];
    pagination?: Pagination;
}

export interface CollectionEntry {
    collection: Node;
}
