const healing = [
    {
      name: 'Treat light wound',
      cost: '2 Actions',
      description: 'Treats a light wound, restoring full functionality, also cures bleed. Requires **medical kit** and a successful DM+8 **medic roll**.',
    },
    {
      name: 'Hospital Recover',
      cost: 'Hospital',
      description: 'Requires a Medically trained person to roll a medic check every day, gives effect x3 in health. Can be done in any place that is "safe" along with any appropriate DMs as such. -DM in dingy cave, +DM in top notch hospital.<br>This also cures one Critical Wound per day. Assuming access to advanced enough TL and tools (subject to DM fiat)',
    },
    {
      name: 'Natural Healing',
      cost: '1 Day',
      description: "Restore health equal to END mod, or Athletics whichever is higher every day. Only works if not being treated in any other way (don't combine with Hospital stay).",
    },
  ];

export default healing;