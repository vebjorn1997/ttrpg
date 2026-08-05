const calledShots = [
    {
        location: 'Head',
        cost: 2,
        penalty: -4,
        description: 'Damage x2, **END check** or be stunned 5 and prone, and drop everything in hands.',
    },
    {
        location: 'Vitals',
        cost: 3,
        penalty: -5,
        description: 'Damage x2, Ignore armor',
    },
    {
        location: 'Leg',
        cost: 2,
        penalty: -2,
        description: '"Hobbled" until medical "treat light wound". **END check** or fall prone.',
    },
    {
        location: 'Arm',
        cost: 2,
        penalty: -2,
        description: 'Drop weapon/equipment, anything that has to do with that arm. Can\'t use arm until treated (light wound).',
    },
];

export default calledShots;