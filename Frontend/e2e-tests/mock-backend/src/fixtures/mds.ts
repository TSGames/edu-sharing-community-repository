import { Mds, MdsEntries } from '../models';
import { ioGroups, ioViews, ioWidgets } from './mds-io';

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
    // A widget id must appear only once - a duplicate is rendered twice by the editor.
    widgets: [
        { id: 'cm:modified', caption: 'Geändert', type: 'date' },
        { id: 'ccm:commonlicense_key', caption: 'Lizenz', type: 'singleoption' },
        { id: 'ccm:replicationsource', caption: 'Quelle', type: 'text' },
        { id: 'ngsearchword', caption: 'Suchbegriff', type: 'text', isSearchable: true },
        ...ioWidgets,
    ],
    views: [
        {
            id: 'search',
            caption: 'Suche',
            html: '<ccm:educationalcontext></ccm:educationalcontext>',
        },
        { id: 'search_suggestions', rel: 'suggestions', html: '' },
        { id: 'search_input', rel: 'suggestions', html: '' },
        ...ioViews,
    ],
    // Group ids the search page looks up by name - `MdsEditorInstanceService` throws
    // "no such group" when one of them is missing.
    groups: [
        { id: 'ngsearch', rendering: 'angular', views: ['search', 'search_suggestions'] },
        { id: 'search_input', rendering: 'angular', views: ['search_input'] },
        ...ioGroups,
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
