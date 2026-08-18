import { FIXED_ISO } from './builders';
import { NodePermissionsHistoryEntry, WorkflowEntry } from '../models';
import { MOCK_USER, OTHER_USER, TEACHER_GROUP } from './authorities';

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
