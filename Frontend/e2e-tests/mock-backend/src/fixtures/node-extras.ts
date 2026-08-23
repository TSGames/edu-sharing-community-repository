import { FIXED_ISO, MOCK_PERSON, REPOSITORY } from './builders';
import {
    DashboardShortcutEntry,
    Node,
    NodePermissionsHistoryEntry,
    NodeRelation,
    NodeStatisticsEntry,
    NodeVersion,
    Usage,
    WorkflowEntry,
} from '../models';
import { MOCK_USER, OTHER_USER, TEACHER_GROUP } from './authorities';
import { files } from './nodes';

/**
 * Fixtures for the two node dialogs that render a *history* rather than a form.
 *
 * All timestamps are derived from the fixed corpus time, so the rendered dates are identical
 * between runs.
 */

const FIXED_TIME = new Date(FIXED_ISO).getTime();
const DAY = 24 * 60 * 60 * 1000;

/**
 * `GET /node/v1/nodes/{repo}/{node}/notifys` - the share history.
 *
 * Newest entry first. `ShareHistoryDialogComponent` derives what an entry changed by diffing it
 * against its *successor* (the older one), and drops entries without any change. The three entries
 * below are chosen so that all three change kinds appear: the newest revoked a group, the middle
 * one added that group and raised the user's permission, the oldest added the user.
 */
export const permissionsHistory: NodePermissionsHistoryEntry[] = [
    {
        date: FIXED_TIME,
        action: 'PERMISSION_ADD',
        user: MOCK_USER,
        permissions: {
            inherited: true,
            permissions: [{ authority: OTHER_USER, permissions: ['Collaborator'] }],
        },
    },
    {
        date: FIXED_TIME - DAY,
        action: 'PERMISSION_ADD',
        user: MOCK_USER,
        permissions: {
            inherited: true,
            permissions: [
                { authority: OTHER_USER, permissions: ['Collaborator'] },
                { authority: TEACHER_GROUP, permissions: ['Consumer'] },
            ],
        },
    },
    {
        date: FIXED_TIME - 2 * DAY,
        action: 'PERMISSION_ADD',
        user: MOCK_USER,
        permissions: {
            inherited: true,
            permissions: [{ authority: OTHER_USER, permissions: ['Consumer'] }],
        },
    },
];

/**
 * `GET /node/v1/nodes/{repo}/{node}/workflow` - the history below the workflow form.
 *
 * The status ids are the built-in ones (`NodeHelperService.getWorkflows()` falls back to them when
 * `workflow.workflows` is unset), so no client configuration is needed to render them with their
 * label and colour. Newest entry first, same as the share history.
 */
export const workflowHistory: WorkflowEntry[] = [
    {
        time: FIXED_TIME,
        status: '200_tocheck',
        comment: 'Bitte fachlich prüfen.',
        editor: MOCK_USER,
        receiver: [TEACHER_GROUP],
    },
    {
        time: FIXED_TIME - DAY,
        status: '100_unchecked',
        comment: 'Erstfassung hochgeladen.',
        editor: MOCK_USER,
        receiver: [],
    },
];

/**
 * `GET /relation/v1/{repo}/{node}` - the relations shown by the relations dialog.
 *
 * The dialog groups them by `type` and renders one node row per relation, so two different types
 * cover both the grouping and the row rendering. The types must be part of
 * `relations.allowedRelations` (unset here, so the frontend falls back to all of them).
 */
export function relationsOf(source: Node): NodeRelation[] {
    const others = files.filter((file) => file.ref.id !== source.ref.id).slice(0, 2);
    const types: NodeRelation['type'][] = ['isBasedOn', 'references'];
    return others.map((target, index) => ({
        type: types[index],
        reverseType: index === 0 ? 'isBasisFor' : 'references',
        createdAt: new Date(FIXED_TIME - (index + 1) * DAY).toISOString(),
        createdBy: MOCK_USER,
        fromNode: source,
        toNode: target,
        isAiGenerated: false,
        evaluation: {},
        metadata: {},
    }));
}

/**
 * `GET /iam/v1/people/{repo}/{person}/dashboard/shortcuts`.
 *
 * A bare array, not a wrapper object. Both entry kinds are represented: `default` entries point at
 * a built-in destination by id, `ref` entries at a node - the shortcut dialog renders them
 * differently (translated label vs. node title).
 */
export const dashboardShortcuts: DashboardShortcutEntry[] = [
    // The ids double as i18n keys below `SHORTCUT_ENTRIES.`, where the built-in ones are spelled
    // in lower case. They carry an explicit `title` on purpose: without one,
    // `ShortcutEntryTitlePipe` falls back to the key and, 500ms later, replaces it with
    // `[MISSING_TRANSLATION: ...]` - under `locale=none` that is the only thing a default entry
    // can ever render, and the delay would make the baseline depend on timing.
    { type: 'default', id: 'workspace', title: 'Arbeitsbereich' },
    { type: 'default', id: 'mycollections', title: 'Meine Sammlungen' },
    // No title: this one goes through the pipe's node branch and shows the node title.
    // Deliberately *not* the node the dialog tests act on - otherwise the dialog reports that the
    // element is already among the shortcuts and hides the add/replace affordances.
    { type: 'ref', node: files[4] },
];

/**
 * `GET /node/v1/nodes/{repo}/{node}/versions/metadata` - the version history of the editorial
 * sidebar's "version management".
 *
 * The component reverses the list and lifts the *current* version (the one matching
 * `cclom:version` on the node) to the top, so the newest entry has to match that property. The
 * comments use the backend's `COMMENT_*` markers, which the component translates into readable
 * labels - a plain string would be shown verbatim, so both kinds appear here.
 */
export const nodeVersions: NodeVersion[] = [
    {
        version: { major: 1, minor: 0, node: { id: '', repo: REPOSITORY, archived: false } },
        comment: 'MAIN_FILE_UPLOAD',
        modifiedAt: new Date(FIXED_TIME - 2 * DAY).toISOString(),
        modifiedBy: MOCK_PERSON,
    },
    {
        version: { major: 1, minor: 1, node: { id: '', repo: REPOSITORY, archived: false } },
        comment: 'METADATA_UPDATE',
        modifiedAt: new Date(FIXED_TIME - DAY).toISOString(),
        modifiedBy: MOCK_PERSON,
    },
    {
        version: { major: 1, minor: 2, node: { id: '', repo: REPOSITORY, archived: false } },
        comment: 'Lizenz auf CC BY 4.0 gesetzt.',
        modifiedAt: new Date(FIXED_TIME).toISOString(),
        modifiedBy: MOCK_PERSON,
    },
];

export function versionsOf(node: Node): NodeVersion[] {
    return nodeVersions.map((version) => ({
        ...version,
        version: { ...version.version, node: node.ref },
    }));
}

/**
 * `GET /usage/v1/usages/node/{nodeId}` - where a node is embedded.
 *
 * The "views and usage" panel of the editorial sidebar lists these below its metric cards.
 */
export function usagesOf(node: Node): Usage[] {
    return [
        {
            appId: 'moodle-mock',
            appType: 'LMS',
            appSubtype: 'moodle',
            appUser: 'maxi',
            appUserMail: 'maxi@example.org',
            courseId: 'kurs-4711',
            courseTitle: 'Naturwissenschaften 7a',
            nodeId: node.ref.id,
            parentNodeId: node.parent?.id ?? '',
            resourceId: 'res-1',
            usageVersion: '1.0',
            created: new Date(FIXED_TIME - 3 * DAY).toISOString(),
            usageCounter: 12,
            distinctPersons: 8,
        },
        {
            appId: 'wordpress-mock',
            appType: 'CMS',
            appSubtype: 'wordpress',
            appUser: 'e2e',
            appUserMail: 'e2e@example.org',
            courseId: 'kurs-0815',
            courseTitle: 'Geografie 9b',
            nodeId: node.ref.id,
            parentNodeId: node.parent?.id ?? '',
            resourceId: 'res-2',
            usageVersion: '1.0',
            created: new Date(FIXED_TIME - DAY).toISOString(),
            usageCounter: 3,
            distinctPersons: 3,
        },
    ];
}

/**
 * `POST /statistic/v1/statistics/nodes/range` - the counters behind the metric cards.
 *
 * The panel sums `counts` across the returned entries; the view card adds direct and embedded
 * views. Fixed numbers, so the rendered figures are part of the baseline.
 */
export function nodeStatisticsOf(nodeIds: string[]): NodeStatisticsEntry[] {
    return nodeIds.map((nodeId) => ({
        counts: {
            VIEW_MATERIAL: 128,
            VIEW_MATERIAL_EMBEDDED: 34,
            DOWNLOAD_MATERIAL: 17,
        },
        node: { ref: { id: nodeId, repo: REPOSITORY, archived: false } },
    }));
}
