const conditions = [
    {
      name: 'Dazzled',
      description: 'You are overstimulated, and vision blurry. Everything is "Hidden" to you.',
      tags: [],
    },
    {
      name: 'Blinded',
      description: "Can't see. Critically fail all attempts requiring vision. Move half speed. Overwrites Dazzled.",
      tags: [],
    },
    {
      name: 'Unconscious',
      description: 'When unconscious you can not act. The only action available to you is to wake up requiring a 8+ END check.',
      tags: [],
    },
    {
      name: 'Stunned X',
      description: "You become senseless. You can't act. X represents how many actions you loose. So Stunned 4, means you loose 1 round, and then the 1st action next round.",
      tags: [],
    },
    {
      name: 'Bleeding',
      description: 'Takes 1 in damage at the start of every round.',
      tags: [],
    },
    {
      name: 'Hobbled',
      description: 'Move half speed.',
      tags: [],
    },
    {
      name: 'Fatigued X',
      description: 'Gives -X to all characteristics.',
      tags: [],
    },
    {
      name: 'Fire',
      description: 'Target takes d6 damage at end of turn, ignore armor (unless outer layer equipped). Can put out fire with END DM6+',
      tags: [],
    },
    {
      name: 'Confusion',
      description: 'Make target "off guard", and will attack random target (hostile or ally)',
      tags: [],
    },
    {
      name: 'Flanked',
      description: 'Make target "off guard"',
      tags: [],
    },
    {
      name: 'Off-guard',
      description: 'Any hostile actions towards you get one easier degree of difficulty, for example average DM 8+ -> easy DM 6+',
      tags: [],
    },
    {
      name: 'Dodge',
      description: 'Any attacks toward suffer a -1 or -DEX mod to hit, whichever is higher.',
      tags: [],
    },
    {
      name: 'Cover',
      description: 'Makes attacks targeting you one degree harder. Gives +4 Armor.',
      tags: [],
    },
    {
      name: 'Heavy Cover',
      description: 'Makes attacks targeting you two degree harder. Gives +8 Armor.',
      tags: [],
    },
    {
      name: 'Hidden',
      description: "Enemy can't see you. Enemies you are hidden to are off guard.",
      tags: [],
    },
    {
      name: 'Grabbed',
      description: "You become off-guard, and immobilized",
      tags: [],
    },
    {
      name: 'Restrained',
      description: "You become off-guard, and immobilized, and you can't take any actions other then trying to escape.",
      tags: [],
    },
    {
      name: 'Immobilized',
      description: "You can not move.",
      tags: [],
    },
  ];

export default conditions;