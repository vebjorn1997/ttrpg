const npcCatalog = [
    {
        name: 'Security Drone',
        movement: '18',
        hp: '12',
        armor: '2',
        features: ['Ranged (2) Auto Cannon, make 2 attacks, Dmg: 2D+1, no MAP', 'Melee (1) Ram, Dmg: 3D', 'Self Destruct (3), make a move then blow itself up, Dmg: 4D + fire (Dex DM 8+ to resist)'],
        description: 'Flying security drone.',
        traitNames: ['Normal'],
    },
    {
        name: 'The Rim Stalker',
        movement: '12',
        hp: '30',
        armor: '0',
        features: ['Melee (1) claw, make 2 attacks, Dmg: 2D+1, End DM 6+ or prone.', 'Melee (2) bite, Dmg: 4D', 'Terrifying Cry, enemies has to succussed an INT check otherwise every attack gets 1 less damage dice. Lasts 1 turn.'],
        description: 'Biological experiment gone wrong.',
        traitNames: ['Normal'],
    },
]

export default npcCatalog;
