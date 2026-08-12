import { Mds, MdsEntries } from '../models';

export const mdsEntries: MdsEntries = {
    metadatasets: [{ id: '-default-', name: 'default', label: 'Default' }],
};

const columns = [
    { id: 'cclom:title' },
    { id: 'cm:modified', format: 'date' },
    { id: 'ccm:commonlicense_key' },
];

/**
 * Minimal but valid metadata set.
 *
 * `lists` drives the columns of every node list (`MdsHelperService.getColumns`), `sorts` the sort
 * dropdown, `widgets` the captions and the search filter sidebar. The column sets mirror
 * `config/defaults/src/main/resources/metadatasets/xml/mds.xml`.
 */
export const defaultMds: Mds = {
    id: '-default-',
    name: 'default',
    lists: [
        { id: 'search', columns: { Default: columns } },
        { id: 'workspace', columns: { Default: columns } },
        { id: 'collectionReferences', columns: { Default: columns } },
        { id: 'genericWidget', columns: { Default: columns } },
        { id: 'genericWidgetTable', columns: { Default: columns } },
        {
            id: 'searchCollections',
            columns: {
                Default: [
                    { id: 'COLLECTION.title' },
                    { id: 'COLLECTION.info' },
                    { id: 'COLLECTION.scope' },
                ],
            },
        },
    ],
    widgets: [
        { id: 'cclom:title', caption: 'Titel', type: 'text', isSearchable: true },
        { id: 'cm:modified', caption: 'Geändert', type: 'date' },
        { id: 'ccm:commonlicense_key', caption: 'Lizenz', type: 'singleoption' },
        { id: 'ccm:replicationsource', caption: 'Quelle', type: 'text' },
        {
            id: 'ccm:educationalcontext',
            caption: 'Bildungsstufe',
            type: 'multivalueFixedBadges',
            hasValues: true,
            values: [
                { id: 'grundschule', caption: 'Grundschule' },
                { id: 'sekundarstufe_1', caption: 'Sekundarstufe I' },
                { id: 'sonstiges', caption: 'Sonstiges' },
            ],
        },
        { id: 'ngsearchword', caption: 'Suchbegriff', type: 'text', isSearchable: true },
    ],
    views: [
        {
            id: 'search',
            caption: 'Suche',
            html: '<ccm:educationalcontext></ccm:educationalcontext>',
        },
        { id: 'search_suggestions', rel: 'suggestions', html: '' },
        { id: 'search_input', rel: 'suggestions', html: '' },
    ],
    // Group ids the search page looks up by name - `MdsEditorInstanceService` throws
    // "no such group" when one of them is missing.
    groups: [
        { id: 'ngsearch', rendering: 'angular', views: ['search', 'search_suggestions'] },
        { id: 'search_input', rendering: 'angular', views: ['search_input'] },
    ],
    sorts: [
        {
            id: 'search',
            columns: [
                { id: 'score', mode: 'desc' },
                { id: 'cclom:title', mode: 'asc' },
                { id: 'cm:modified', mode: 'desc' },
            ],
            default: { sortBy: 'score', sortAscending: false },
            defaultSearch: { sortBy: 'score', sortAscending: false },
        },
        {
            id: 'workspace',
            columns: [
                { id: 'cm:name', mode: 'asc' },
                { id: 'cm:modified', mode: 'desc' },
            ],
            default: { sortBy: 'cm:name', sortAscending: true },
        },
        {
            id: 'collectionReferences',
            columns: [{ id: 'cm:modified', mode: 'desc' }],
            default: { sortBy: 'cm:modified', sortAscending: false },
        },
    ],
};
