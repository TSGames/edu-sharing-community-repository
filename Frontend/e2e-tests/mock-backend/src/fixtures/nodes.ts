import { Node } from '../models';
import { makeFile, makeFolder, USER_HOME_ID } from './builders';

/**
 * The fixed node corpus every flow works on.
 *
 * Ids, order, names and dates are constant, which is what makes result lists and therefore
 * screenshots reproducible.
 */

export const FOLDER_LESSONS = '00000000-0000-4000-a000-000000000010';
export const FOLDER_IMAGES = '00000000-0000-4000-a000-000000000011';
export const FOLDER_ARCHIVE = '00000000-0000-4000-a000-000000000012';

export const folders: Node[] = [
    makeFolder({ id: FOLDER_LESSONS, name: 'Unterrichtsmaterial' }),
    makeFolder({ id: FOLDER_IMAGES, name: 'Bilder' }),
    makeFolder({ id: FOLDER_ARCHIVE, name: 'Archiv' }),
];

const fileTitles = [
    'Bruchrechnen leicht gemacht',
    'Der Wasserkreislauf',
    'Englische Unregelmäßige Verben',
    'Geometrie: Dreiecke',
    'Die Weimarer Republik',
    'Photosynthese im Überblick',
    'Programmieren mit Scratch',
    'Musiktheorie Grundlagen',
    'Klimazonen der Erde',
    'Statistik: Mittelwert und Median',
];

export const files: Node[] = fileTitles.map((title, index) =>
    makeFile({
        id: `00000000-0000-4000-a000-0000000001${String(index).padStart(2, '0')}`,
        name: `${String(index + 1).padStart(2, '0')}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
        title,
        previewIndex: (index % 5) + 1,
        size: 100000 + index * 4096,
        license: index % 3 === 0 ? 'CC_BY' : index % 3 === 1 ? 'CC_BY_SA' : 'COPYRIGHT_FREE',
    }),
);

/** Children of `-userhome-`: folders first, then files — same ordering the backend applies. */
export const userHomeChildren: Node[] = [...folders, ...files.slice(0, 6)];

export const folderChildren: { [folderId: string]: Node[] } = {
    [FOLDER_LESSONS]: files.slice(6).map((file) => ({ ...file, parent: folders[0].ref })),
    [FOLDER_IMAGES]: [],
    [FOLDER_ARCHIVE]: [],
};

export const userHomeFolder: Node = makeFolder({
    id: USER_HOME_ID,
    name: 'Eigene Dateien',
    parent: USER_HOME_ID,
});

export const allNodes: Node[] = [userHomeFolder, ...folders, ...files];

export function findNode(id: string): Node | undefined {
    if (id === '-userhome-' || id === USER_HOME_ID) {
        return userHomeFolder;
    }
    return allNodes.find((node) => node.ref.id === id);
}

export function childrenOf(id: string): Node[] {
    if (id === '-userhome-' || id === USER_HOME_ID) {
        return userHomeChildren;
    }
    return folderChildren[id] ?? [];
}
