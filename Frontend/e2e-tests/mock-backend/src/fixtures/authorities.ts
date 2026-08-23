import {
    Ace,
    Authority,
    AuthorityEntries,
    NodePermissionEntry,
    OrganizationEntries,
} from '../models';

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
    profile: { firstName: 'End', lastName: 'Toend' },
    properties: {
        'cm:userName': ['e2e'],
        'cm:firstName': ['End'],
        'cm:lastName': ['Toend'],
        'cm:email': ['e2e@example.org'],
    },
};

export const OTHER_USER: Authority = {
    authorityName: 'maxi',
    authorityType: 'USER',
    editable: true,
    profile: { firstName: 'Maxi', lastName: 'Musterfrau' },
    properties: {
        'cm:userName': ['maxi'],
        'cm:firstName': ['Maxi'],
        'cm:lastName': ['Musterfrau'],
        'cm:email': ['maxi@example.org'],
    },
};

export const TEACHER_GROUP: Authority = {
    authorityName: 'GROUP_lehrkraefte',
    authorityType: 'GROUP',
    editable: true,
    profile: { displayName: 'Lehrkräfte', groupType: 'Lehrkräfte' },
    properties: {
        'cm:authorityDisplayName': ['Lehrkräfte'],
        'ccm:groupType': ['Lehrkräfte'],
    },
};

/**
 * Two authorities that are *not* on the node.
 *
 * The simple-edit invite section renders the recently invited authorities as toggle tiles and
 * marks the ones the node is already shared with (`SimpleEditInviteComponent.isInvited`). Without
 * these two, every tile would be active and the unselected state would never be captured.
 */
const RECENT_USER: Authority = {
    authorityName: 'jonas',
    authorityType: 'USER',
    editable: true,
    properties: {
        'cm:userName': ['jonas'],
        'cm:firstName': ['Jonas'],
        'cm:lastName': ['Beispiel'],
        'cm:email': ['jonas@example.org'],
    },
};

const RECENT_GROUP: Authority = {
    authorityName: 'GROUP_fachschaft_mathematik',
    authorityType: 'GROUP',
    editable: true,
    properties: {
        'cm:authorityDisplayName': ['Fachschaft Mathematik'],
        'ccm:groupType': ['Fachschaft'],
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
    // Mixed on purpose: the first two are shared with the node, the last two are not.
    authorities: [OTHER_USER, TEACHER_GROUP, RECENT_USER, RECENT_GROUP],
    pagination: { total: 4, from: 0, count: 4 },
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
 * A populated list covering all three authority kinds a permission list can hold - the owner (not
 * editable), an invited user, a group and "everyone" - which is what the share dialog renders in
 * its "invited" tab. The share dialog builds its *inherited* section from the parent folder, so
 * that part is `parentPermissions`, not `inheritedPermissions` below.
 */
export const nodePermissions: NodePermissionEntry = {
    permissions: {
        localPermissions: {
            inherited: true,
            permissions: [ownerAce, collaboratorAce, groupAce, everyoneAce],
        },
        inheritedPermissions: [ownerAce],
    },
};

/**
 * Permissions of the *parent* folder - only the owner.
 *
 * The simple-edit invite section reads the parent's permissions separately and blocks itself with
 * `SIMPLE_EDIT.INVITE.ERROR_INHERIT` as soon as the node inherits from a parent that shares with
 * somebody else (`SimpleEditInviteComponent.hasInvalidState`), because the simplified toggles
 * cannot express that state. A parent that is not shared is the normal case and the one where the
 * section actually renders its options.
 */
export const parentPermissions: NodePermissionEntry = {
    permissions: {
        localPermissions: {
            inherited: false,
            permissions: [ownerAce],
        },
        inheritedPermissions: [],
    },
};

/**
 * `GET /organization/v1/organizations/{repository}` - the organizations the user is a member of.
 *
 * The simple-edit invite section turns every organization into a toggle, plus one toggle per
 * configured `simpleEdit.organization.groupTypes` subgroup (default `ORG_ADMINISTRATORS`, resolved
 * through `GET /iam/v1/groups/{repository}/{group}/type/{type}`). Without an organization the
 * section only offers "no sharing" and "publish".
 */
export const ORG_AUTHORITY = 'GROUP_ORG_musterschule';

export const organizations: OrganizationEntries = {
    organizations: [
        {
            authorityName: ORG_AUTHORITY,
            authorityType: 'GROUP',
            groupName: 'ORG_musterschule',
            editable: false,
            profile: { displayName: 'Musterschule', groupType: 'ORGANIZATION' },
        },
    ],
    pagination: { total: 1, from: 0, count: 1 },
};
