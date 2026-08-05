const npcCatalog = [
    {
        name: 'Security Drone',
        difficulty: '1',
        movement: '10',
        hp: '10',
        armor: '10',
        features: [],
        description: 'The most common form of NPC encountered. Regular goons. Will have 1-2 special features.',
        // trait names resolved to UUIDs in seed.ts after traits are inserted
        traitNames: ['Normal'],
    },
]

export default npcCatalog;
