import { Ace, Authority, AuthorityEntries, NodePermissionEntry } from '../models';

/**
 * Authorities used by the share and simple-edit dialogs.
 *
 * Both render lists of people and groups, so an empty fixture would show an empty dialog. The set
 * below covers all three kinds a permission list can contain: the owner, another user, and a group.
 */

export const MOCK_USER: Authority = {
    authorityName: 'e2e',
    authorityType: 'USER',
    editable: true,
    properties: {
        'cm:userName': ['e2e'],
        'cm:firstName': ['End'],
        'cm:lastName': ['Toend'],
        'cm:email': ['e2e@example.org'],
    },
};

const OTHER_USER: Authority = {
    authorityName: 'maxi',
    authorityType: 'USER',
    editable: true,
    properties: {
        'cm:userName': ['maxi'],
        'cm:firstName': ['Maxi'],
        'cm:lastName': ['Musterfrau'],
        'cm:email': ['maxi@example.org'],
    },
};

const TEACHER_GROUP: Authority = {
    authorityName: 'GROUP_lehrkraefte',
    authorityType: 'GROUP',
    editable: true,
    properties: {
        'cm:authorityDisplayName': ['Lehrkräfte'],
        'ccm:groupType': ['Lehrkräfte'],
    },
};

const EVERYONE: Authority = {
    authorityName: 'GROUP_EVERYONE',
    authorityType: 'EVERYONE',
    editable: false,
    properties: { 'cm:authorityDisplayName': ['Alle registrierten Nutzer:innen'] },
};

/** `GET /iam/v1/authorities/{repository}/recent` - the "recently invited" suggestions. */
export const recentAuthorities: AuthorityEntries = {
    authorities: [OTHER_USER, TEACHER_GROUP],
    pagination: { total: 2, from: 0, count: 2 },
};

const ownerAce: Ace = {
    authority: MOCK_USER,
    permissions: ['Coordinator'],
    editable: false,
    user: { firstName: 'End', lastName: 'Toend', email: 'e2e@example.org' },
};

const collaboratorAce: Ace = {
    authority: OTHER_USER,
    permissions: ['Collaborator'],
    editable: true,
    user: { firstName: 'Maxi', lastName: 'Musterfrau', email: 'maxi@example.org' },
};

const groupAce: Ace = {
    authority: TEACHER_GROUP,
    permissions: ['Consumer'],
    editable: true,
    group: { displayName: 'Lehrkräfte', groupType: 'Lehrkräfte' },
};

const everyoneAce: Ace = {
    authority: EVERYONE,
    permissions: ['Consumer'],
    editable: true,
    group: { displayName: 'Alle registrierten Nutzer:innen' },
};

/**
 * `GET /node/v1/nodes/{repo}/{node}/permissions`.
 *
 * A populated list: the owner (not editable), an invited user and a group, plus one inherited
 * entry - that is what the share dialog renders in its "invited" tab.
 */
export const nodePermissions: NodePermissionEntry = {
    permissions: {
        localPermissions: {
            inherited: true,
            permissions: [ownerAce, collaboratorAce, groupAce],
        },
        inheritedPermissions: [everyoneAce],
    },
};
