import { Node } from '../models';
import { FIXED_ISO, MOCK_PERSON, ref } from './builders';
import { files } from './nodes';

export const COLLECTION_MATH = '00000000-0000-4000-b000-000000000001';
export const COLLECTION_SCIENCE = '00000000-0000-4000-b000-000000000002';

function makeCollection(options: {
    id: string;
    title: string;
    description: string;
    color: string;
    referenceCount: number;
}): Node {
    return {
        ref: ref(options.id),
        name: options.title,
        title: options.title,
        type: 'ccm:map',
        isDirectory: true,
        aspects: ['ccm:collection'],
        createdAt: FIXED_ISO,
        createdBy: MOCK_PERSON,
        modifiedAt: FIXED_ISO,
        modifiedBy: MOCK_PERSON,
        owner: MOCK_PERSON,
        access: ['Read', 'Write', 'Delete', 'ChangePermissions', 'AddChildren'],
        mediatype: 'collection',
        repositoryType: 'ALFRESCO',
        collection: {
            title: options.title,
            description: options.description,
            type: 'default',
            level0: true,
            fromUser: true,
            scope: 'MY',
            color: options.color,
            viewtype: 'card',
            orderMode: 'custom',
            orderAscending: true,
            pinned: false,
            childCollectionsCount: 0,
            childReferencesCount: options.referenceCount,
        },
        properties: {
            'cm:name': [options.title],
            'ccm:collectiontype': ['default'],
            'ccm:collectionscope': ['MY'],
        },
    };
}

export const collections: Node[] = [
    makeCollection({
        id: COLLECTION_MATH,
        title: 'Mathematik Sek I',
        description: 'Materialien für die Sekundarstufe I.',
        color: '#1a73e8',
        referenceCount: 3,
    }),
    makeCollection({
        id: COLLECTION_SCIENCE,
        title: 'Naturwissenschaften',
        description: 'Biologie, Chemie und Physik.',
        color: '#188038',
        referenceCount: 2,
    }),
];

/** Collection references are ordinary nodes carrying the original node id. */
export const collectionReferences: { [collectionId: string]: Node[] } = {
    [COLLECTION_MATH]: files.slice(0, 3).map((file, index) => ({
        ...file,
        ref: ref(`00000000-0000-4000-c000-00000000000${index + 1}`),
        aspects: [...(file.aspects ?? []), 'ccm:collection_io_reference'],
        properties: {
            ...file.properties,
            'ccm:original': [file.ref.id],
        },
    })),
    [COLLECTION_SCIENCE]: files.slice(3, 5).map((file, index) => ({
        ...file,
        ref: ref(`00000000-0000-4000-c000-00000000001${index + 1}`),
        aspects: [...(file.aspects ?? []), 'ccm:collection_io_reference'],
        properties: {
            ...file.properties,
            'ccm:original': [file.ref.id],
        },
    })),
};

export function findCollection(id: string): Node | undefined {
    return collections.find((collection) => collection.ref.id === id);
}
