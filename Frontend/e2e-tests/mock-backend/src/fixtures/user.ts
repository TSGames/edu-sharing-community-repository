import { RepoEntries, UserEntry } from '../models';
import { KnownUser } from '../session';
import { ref, USER_HOME_ID } from './builders';

export function userEntry(user: KnownUser): UserEntry {
    return {
        editProfile: false,
        person: {
            authorityName: user.userName,
            authorityType: 'USER',
            userName: user.userName,
            profile: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: null,
            },
            homeFolder: ref(USER_HOME_ID),
            sharedFolders: [],
            organizations: [],
            quota: { enabled: false },
            editable: true,
            status: { status: 'active', date: 0 },
        },
    };
}

/** Tool permissions gate most action buttons; this set covers the read-only flows plus editing. */
export const toolPermissions: string[] = [
    'TOOLPERMISSION_WORKSPACE',
    'TOOLPERMISSION_SEARCH',
    'TOOLPERMISSION_COLLECTION_EDITORIAL',
    'TOOLPERMISSION_COLLECTION_CHANGE_OWNER',
    'TOOLPERMISSION_INVITE',
    'TOOLPERMISSION_CREATE_ELEMENTS_FOLDERS',
    'TOOLPERMISSION_CREATE_ELEMENTS_FILES',
    // Without it the "relations" entry of the render page's actionbar stays disabled.
    'TOOLPERMISSION_MANAGE_RELATIONS',
];

export const repositories: RepoEntries = {
    repositories: [
        {
            id: '-home-',
            title: 'edu-sharing (Mock)',
            icon: '/edu-sharing/themes/default/images/common/logo.svg',
            logo: '/edu-sharing/themes/default/images/common/logo.svg',
            isHomeRepo: true,
            repositoryType: 'ALFRESCO',
            renderingSupported: false,
        },
    ],
};
