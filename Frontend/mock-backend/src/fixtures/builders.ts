import { config } from '../config';
import { Node, NodeRef, Pagination, Person } from '../models';

export const FIXED_ISO = new Date(config.fixedTime).toISOString();
/** Milliseconds as string — the REST API returns `cm:created` etc. as epoch millis strings. */
export const FIXED_MILLIS = String(config.fixedTime);

export const REPOSITORY = '-home-';
export const USER_HOME_ID = '00000000-0000-4000-a000-000000000001';

export const MOCK_PERSON: Person = {
    firstName: 'End',
    lastName: 'Toend',
    mailbox: 'e2e@example.org',
    profile: { firstName: 'End', lastName: 'Toend', email: 'e2e@example.org' },
};

export function ref(id: string): NodeRef {
    return { id, repo: REPOSITORY, archived: false, isHomeRepo: true };
}

export function pagination(total: number, from: number, count: number): Pagination {
    return { total, from, count };
}

/**
 * Applies `skipCount`/`maxItems` to a fixed corpus so that paging controls behave like the real
 * backend (page 2 shows different items) without any randomness.
 */
export function paginate<T>(
    items: T[],
    query: URLSearchParams,
    defaultMaxItems = 25,
): { page: T[]; pagination: Pagination } {
    const from = Number(query.get('skipCount') ?? '0') || 0;
    const maxItems = Number(query.get('maxItems') ?? String(defaultMaxItems)) || defaultMaxItems;
    const page = items.slice(from, from + maxItems);
    return { page, pagination: pagination(items.length, from, page.length) };
}

interface FileOptions {
    id: string;
    name: string;
    title: string;
    mimetype?: string;
    mediatype?: string;
    size?: number;
    previewIndex?: number;
    license?: string;
    parent?: string;
}

const ACCESS = [
    'Read',
    'ReadAll',
    'Write',
    'Delete',
    'CCPublish',
    'ChangePermissions',
    'AddChildren',
    'Consumer',
];

export function makeFile(options: FileOptions): Node {
    const previewIndex = options.previewIndex ?? 1;
    const license = options.license ?? 'CC_BY';
    return {
        ref: ref(options.id),
        parent: ref(options.parent ?? USER_HOME_ID),
        name: options.name,
        title: options.title,
        type: 'ccm:io',
        isDirectory: false,
        aspects: ['ccm:eduscope', 'cclom:lifecycle', 'cclom:general'],
        createdAt: FIXED_ISO,
        createdBy: MOCK_PERSON,
        modifiedAt: FIXED_ISO,
        modifiedBy: MOCK_PERSON,
        owner: MOCK_PERSON,
        access: ACCESS,
        mimetype: options.mimetype ?? 'application/pdf',
        mediatype: options.mediatype ?? 'file-pdf',
        metadataset: '-default-',
        repositoryType: 'ALFRESCO',
        size: String(options.size ?? 128000),
        commentCount: 0,
        isPublic: false,
        usedInCollections: [],
        iconURL: '/edu-sharing/themes/default/images/common/mime-types/svg/file-pdf.svg',
        preview: {
            url: `/edu-sharing/preview/preview-${previewIndex}.png`,
            width: 800,
            height: 600,
            isIcon: false,
            isGenerated: true,
            mimetype: 'image/png',
        },
        content: { url: `/edu-sharing/eduservlet/download?nodeId=${options.id}`, version: '1.0' },
        license: {
            icon: `/edu-sharing/ccimages/licenses/${license.toLowerCase()}.svg`,
            url: 'https://creativecommons.org/licenses/by/4.0/',
        },
        properties: {
            'cclom:title': [options.title],
            'cm:name': [options.name],
            'cm:created': [FIXED_MILLIS],
            'cm:modified': [FIXED_MILLIS],
            'ccm:commonlicense_key': [license],
            'ccm:replicationsource': [],
            'cclom:general_description': [`Mock material "${options.title}".`],
            'ccm:educationalcontext': ['sonstiges'],
            'virtual:licenseicon': [`/edu-sharing/ccimages/licenses/${license.toLowerCase()}.svg`],
        },
    };
}

export function makeFolder(options: { id: string; name: string; parent?: string }): Node {
    return {
        ref: ref(options.id),
        parent: ref(options.parent ?? USER_HOME_ID),
        name: options.name,
        title: options.name,
        type: 'cm:folder',
        isDirectory: true,
        aspects: [],
        createdAt: FIXED_ISO,
        createdBy: MOCK_PERSON,
        modifiedAt: FIXED_ISO,
        modifiedBy: MOCK_PERSON,
        owner: MOCK_PERSON,
        access: ACCESS,
        mediatype: 'folder',
        metadataset: '-default-',
        repositoryType: 'ALFRESCO',
        size: '0',
        iconURL: '/edu-sharing/themes/default/images/common/mime-types/svg/folder.svg',
        properties: {
            'cm:name': [options.name],
            'cm:created': [FIXED_MILLIS],
            'cm:modified': [FIXED_MILLIS],
        },
    };
}
