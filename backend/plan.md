This document contains rules for a new hombrew implementation of the game Traveller 2e Mongoose.

## Contents
- [[#1 Cost]]
- [[#2 Cost]]
- [[#3 Cost]]
- [[#Reactions (Limit to 1 per round)]] 
- [[#Status Effects]]
- [[#Weapons Traits]]
- [[#Healing/Medical System]]
- [[#Weapons Classification]]
- [[#Weapons]]
- [[#Armor]] 
- [[#Drugs/Healing]]
- [[#Drones]]
- [[#Equipment Manufacturers]]
- [[#Feats]]

## Basic Actions


| Action           | Cost | Description                                                                                                          |
| ---------------- | ---- | -------------------------------------------------------------------------------------------------------------------- |
| Move             | 1    |                                                                                                                      |
| Attack           | 1    | Each subsequent attack imposes a Multiple Attack Penalty (MAP) which is an attack penalty of -2/-4 and so on to hit. |
| Draw/Holster     | 1    |                                                                                                                      |
| Use Item         | 1    | Apply stims or combat drugs or similar item                                                                          |
| Change Stance    | 1    | Prone/Stand/Crouch                                                                                                   |
| Reload (simple)  | 1    | Reload Weapon or clear simple jam                                                                                    |
| Reload (complex) | 2    | Reload more complex weapons, or clear complex jams                                                                   |
| First Aid        | 2    |                                                                                                                      |
| Take Cover       | 1    | Gives either cover, or heavy cover condition.                                                                        |
| Hide             | 1    | Successful stealth roll makes you hidden from enemy.                                                                 |
| Advanced Strike  | 3    | Lets you use 2 or 3 actions to make an attack, giving a +1 or +2 to your attack roll.                                |

## 1 Cost

| Action         | Description                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Aim            | +1 to hit                                                                                                      |
| Identify Enemy | Identify enemy, Recon 8+ or relevant skill (any markings, factions, weapons, feats, or skills of enemy etc...) |
## 2 Cost

| Action           | Description                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Disengage        | Moves away from enemy without triggering attack of opportunity                                                                                                           |
| Inspiring Speech | One ally (including self) who can hear you receives a boon die.                                                                                                          |
| Called Shots     | Target specific hit location (head, hands, legs)                                                                                                                         |
| Grapple          |                                                                                                                                                                          |
| Disarm           |                                                                                                                                                                          |
| Charge           | Move & attack, gives a +2 to attack roll                                                                                                                                 |
| Combat Hack      | Can hack any electronic object/enemy at distance (30m). Choose one<br>- Turn object to your side (DM 10+)<br>- Turn object off (DM 8+)<br>- Make object run away (DM 8+) |
| Combat Sprint    | Move 2x, and give "Dodge" condition                                                                                                                                      |
| Controlled Burst | Choose One:<br>- Ignore Cover, or turn Heavy Cover -> Cover<br>-                                                                                                         |
| Overwatch        | Requires Auto X. Attacks all enemies in that area when they enter or end their turn in the area (subject to ammo constraints). No MAP.                                   |

Called shots, hit locations effects

| Location | Cost                                 | Penalty | Description                                                                                              |
| -------- | ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------- |
| Vitals   | 3 (requires Called Shot (Adv.) feat) | -5      | Damage x2, Ignore armor                                                                                  |
| Head     | 2                                    | -4      | Damage x2, **END check** or be stunned 5 and prone, and drop everything in hands.                        |
| Leg      | 2                                    | -2      | "Hobbled" until medical "treat light wound". **END check** or fall prone.                                |
| Arm      | 2                                    | -2      | Drop weapon/equipment, anything that has to do with that arm. Can't use arm until treated (light wound). |
## 3 Cost

| Action                 | Description                                                                                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full Auto Attack       | 3x ammo usage, attacks equal to Auto score                                                                                                                                                     |
| Called Shot (Advanced) | Target specific hit location (head, hands, legs, or Vitals)                                                                                                                                    |
| Suppressive Fire       | Targets a 6x6 meters area, any enemy who remains in the area suffers -1 DM to all actions. If enemy is out of cover, suffers an attack by the player subject to a -1 DM, at end of enemy turn. |


- **Let "spending more" buy a bonus, not just unlock the action.** PF2 doesn't really do this but Traveller's skill-roll core makes it very natural to let players choose to spend 3 actions instead of 2 on a Standard Skill Check for a flat DM (Dice Modifier) bonus, say +1 or +2. That gives you a clean "rush it vs. do it right" lever without inventing a ton of new distinct activities.
## Reactions (Limit to 1 per round)

| Action                | Description                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dodge                 | Gives the condition Dodge                                                                                                                                               |
| Dive for Cover        | Dive up to 2x (Athletics skill) meters to any nearby area, if diving behind cover, also counts as take cover action. Has to be standing.                                |
| Parry                 | In close combat, apply melee skill as negative DM to attack roll.                                                                                                       |
| Attack of Opportunity | Attack any enemy trying to run away from character form melee range. Requires an available reaction, has to make attack with one handed ranged weapon, or melee weapon. |

## Conditions

| Name        | Description                                                                                                                                              | Tags |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Dazzled     | You are overstimulated, and vision blurry. Everything is "Hidden" to you.                                                                                |      |
| Blinded     | Can't see. Critically fail all attempts requiring vision. Move half speed. Overwrites Dazzled.                                                           |      |
| Unconscious | When unconscious you can not act. The only action available to you is to wake up requiring a 8+ END check.                                               |      |
| Stunned X   | You become senseless. You can't act. X represents how many actions you loose. So Stunned 4, means you loose 1 round, and then the 1st action next round. |      |
| Bleeding    | Takes 1 in damage at the start of every round.                                                                                                           |      |
| Hobbled     | Move half speed.                                                                                                                                         |      |
| Fatigued X  | Gives -X to all characteristics.                                                                                                                         |      |
| Fire        | Target takes d6 damage at end of turn, ignore armor (unless outer layer equipped). Can put out fire with END DM6+                                        |      |
| Confusion   | Make target "off guard", and will attack random target (hostile or ally)                                                                                 |      |
| Flanked     | Make target "off guard"                                                                                                                                  |      |
| Off-guard   | Any hostile actions towards you get one easier degree of difficulty, for example average DM 8+ -> easy DM 6+                                             |      |
| Dodge       | Any attacks toward suffer a -1 or -DEX mod to hit, whichever is higher.                                                                                  |      |
| Cover       | Makes attacks targeting you one degree harder. Gives +4 Armor.                                                                                           |      |
| Heavy Cover | Makes attacks targeting you two degree harder. Gives +8 Armor.                                                                                           |      |
| Hidden      | Enemy can't see you. Enemies you are hidden to are off guard.                                                                                            |      |
## Weapons Traits

| Name           | Description                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Heavy          | Heavy weapons require 10+ STR modifier to wield effortlessly. Otherwise, -4 to all attacks.               |
| Super Heavy    | Heavy weapons require 12+ STR modifier to wield effortlessly. Otherwise, -4 to all attacks.               |
| Auto X         | Allows for Full Auto Attack action.                                                                       |
| Concealable    | Gives +2 to conceal any weapon form any search electronic or physical.                                    |
| Vac Suit X     | Works in space, contains life support. X is the life support x12, so Vac Suit 2 is 24hrs of life support. |
| Zero-G         | Weapon does not produce any recoil, can be used in <0.1g without any noticeable problems.                 |
| Complex Reload | Requires a complex reload skill to reload weapon in combat.                                               |
## Healing/Medical System

When a physical stat reaches 0, you receive a critical injury. This is a crippling wound that requires significant healing to recover from.

When two stats are at 0, you are unconscious and will not wake until at least two physical stats are above 0.

When three physical stats are 0, you are dead! Medical treatment may exist.

#### Critical Injury

| Char | Name                  | Description                                                                                                                              |
| ---- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| STR  | Shattered Spine       | Partial or Total paralysis. Fully immobilized or hobbled until treated. Up to DM to decide.                                              |
| STR  | Severed Limb          | Total loss of limb, requires a replacement. Can't use that hand/leg.                                                                     |
| DEX  | Destroyed Eyes        | Permanent blinded until replaced.                                                                                                        |
| DEX  | Nerve Damage          | Random twitches in arms, suffer a -4 to anything requiring fine manipulation such as electronics or shooting a gun.                      |
| DEX  | Ruptured Eardrum      | Deafened. Off-guard to any check requiring hearing; can't receive verbal commands (Inspiring Speech doesn't work on them) until treated. |
| END  | Ruptured Artery       | Bleeding upgrades to 2 damage/round, ignoring armor, until treated                                                                       |
| END  | Crushed Trachea       | END check each round or lose one action gasping for air, until treated.                                                                  |
| END  | Internal Organ Damage | Fatigued 1, permanent and stacking with any other Fatigued source, until treated.                                                        |

| Name              | Cost      | Description                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Treat light wound | 2 Actions | Treats a light wound, restoring full functionality, also cures bleed. Requires **medical kit** and a successful DM+8 **medic roll**.                                                                                                                                                                                                              |
| Hospital Recover  | Hospital  | Requires a Medically trained person to roll a medic check every day, gives effect x3 in health. Can be done in any place that is "safe" along with any appropriate DMs as such. -DM in dingy cave, +DM in top notch hospital.<br>This also cures one Critical Wound per day. Assuming access to advanced enough TL and tools (subject to DM fiat) |
| Natural Healing   | 1 Day     | Restore health equal to END mod, or Athletics whichever is higher every day. Only works if not being treated in any other way (don't combine with Hospital stay).                                                                                                                                                                                 |
## Weapons Classification

| Level | Name           | Description                           |
| ----- | -------------- | ------------------------------------- |
| 0     | Civilian       | Low mag rifles, bludgeons, no armor   |
| 1     | Paramilitary   | Pistols, shotguns, knifes, armor <5   |
| 2     | Police         | Rifles, stunning grenades, armor < 10 |
| 3     | Military       | heavy, grenades, any armor            |
| 4     | Special Forces | WMD                                   |

## Weapons

### Laser
| Name       | Type   | TL  | Range c/m/l | Damage | Mag | Cost   | Weapon Classification | Trait | Desc |
| ---------- | ------ | --- | ----------- | ------ | --- | ------ | --------------------- | ----- | ---- |
| Las Rifle  | Rilfe  | 11  |             | 2D+3   | 100 | 5000cr | 2                     |       |      |
| Las Pistol | Pistol | 12  |             | 3D     | 100 | 1000cr | 2                     |       |      |

### Slug

| Name            | Type   | TL  | Range c/m/l    | Damage | Mag | Cost | Weapon Classification | Trait       | Desc |
| --------------- | ------ | --- | -------------- | ------ | --- | ---- | --------------------- | ----------- | ---- |
| Wayfarer        | Rifle  | 8   | 150, 300, 450  | 3D+3   | 30  | 500  | 1                     |             |      |
| Longshank Mk.II | Rilfe  | 10  | 450, 900, 1350 | 4D     | 3   | 500  | 0                     | Heavy       |      |
| Vantage Compact | Rifle  | 8   | 50, 100, 150   | 3D     | 30  | 1000 | 2                     | Auto 3      |      |
| M9              | Pistol | 9   | 10/15/30       | 2D-3   | 6   | 1000 | 2                     | Concealable |      |
| GG17            | Pistol | 7   | 10/15/30       | 3D-3   | 12  | 100  | 2                     | Auto 2      |      |
| VK 2            | Pistol | 8   | 10/15/30       | 3D     | 6   | 500  | 3                     | AP 2        |      |
### Melee

| Name           | Type     | TL  | Range c/m/l | Damage | Mag | Cost   | Weapon Classification | Trait          | Desc |
| -------------- | -------- | --- | ----------- | ------ | --- | ------ | --------------------- | -------------- | ---- |
| Improv         |          | 0   | 2           | 1D     |     |        | 0                     |                |      |
| Dagger         | Blade    | 6   | 2           | 2D     |     | 100cr  | 2                     |                |      |
| Boarding Sword | Blade    | 10  | 2           | 2D+3   |     | 100cr  | 3                     |                |      |
| Monoblade      |          | 12  | 2           |        |     | 10kcr  | 3                     | Ignore Armor   |      |
| Cludge         | Bludgeon |     | 2           | 1D+3   |     | 100cr  | 0                     |                |      |
| Baseball Bat   | Bludgeon |     | 2           | 2D     |     | 100cr  | 0                     |                |      |
| Wraps          | Unarmed  | 1   | 2           | 1D+3   |     | 100cr  | 0                     |                |      |
| Brass Knuckles | Unarmed  | 6   | 2           | 2D+3   |     | 100cr  | 1                     |                |      |
| Shotgun Fist   | Unarmed  |     | 2           | 4D     |     | 5000cr | 2                     | Complex Reload |      |

### Heavy Weapons

### Explosives

| Name                | TL  | Dmg | Cost   | Weapon Classification | Trait                                                                               | Desc |
| ------------------- | --- | --- | ------ | --------------------- | ----------------------------------------------------------------------------------- | ---- |
| Compression Grenade | 14  | 8D  | 5000cr | 4                     | Ignore Armor                                                                        |      |
| Molotov Cocktail    | 7   | 2D  | 100cr  | 2                     | Fire                                                                                |      |
| Frag Grenade        | 7   | 4D  | 500cr  | 3                     | Explosive (10m), bleeding                                                           |      |
| Flash Grenade       | 8   |     | 500cr  | 2                     | END 10+ to resist:<br>- crit fail, blinded (2 rounds)<br>- fail, dazzled (2 rounds) |      |

## Armor

There are different types or layers: bottom, top, and outer.

| Name             | Type   | TL  | Armor | Cost   | Weapon Classification | Trait      | Desc |
| ---------------- | ------ | --- | ----- | ------ | --------------------- | ---------- | ---- |
| Vac Suit Mk. I   | Outer  | 9   | +4    | 5000cr | 1                     | Vac Suit 2 |      |
| Armored Clothing | Bottom | 8   | +2    | 1000cr | 1                     |            |      |
| Heavy Clothing   | Top    | 8   | +2    | 1000cr | 2                     |            |      |
| Ceramic Armor    | Top    | 10  | +6    | 1000cr | 2                     |            |      |
| Flak Armor       | Top    | 10  | +8    | 1000cr | 3                     |            |      |
| Riot Gear        | Top    | 8   | +6    | 1000cr | 2                     |            |      |

## Drugs/Healing

| Name         | Cost   | Description                                                                  |
| ------------ | ------ | ---------------------------------------------------------------------------- |
| Combat Stims | 500cr  | +4 to any characteristic, suffers *fatigued* next round, lasts until rested. |
| Medical Kit  | 1000cr | Required for most/all medical procedures.                                    |
## Drones

| Name               | Cost   | Type  | Health | Damage | Description                                                                                                                                           |
| ------------------ | ------ | ----- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mk. II Eagle Scout | 5000cr | Recon | 6      |        | Small nimble quad chopper capable of being operated at a range of 5km, in or out of atmosphere. Provides heat and visual optics. Primitive AI. TL 10. |

## Equipment Manufacturers

| Name                                            | Trait                  | Type    |
| ----------------------------------------------- | ---------------------- | ------- |
| [[Manufacturers\|Voss-Kesler "Voss" Armaments]] | Precision Tooling      | Weapons |
| [[Manufacturers\|Harrow Dynamics]]              | Field-Strip Action     | Weapons |
| [[Manufacturers\|Meridian Optics]]              | Layered Optics         | Weapons |
| [[Manufacturers\|Ashgrave Munitions]]           | Hardened Loads         | Weapons |
| [[Manufacturers\|Thessaly Combine]]             | Sustained Fire Systems | Weapons |
| [[Manufacturers\|Eagle Industries]]             |                        | Drones  |

### Feats
Feats represents genetic modifications, cybernetics, or specialized training.

Some feats can be acquired through association with institutions or organizations. 

To learn a feat, downtime is required and so is a logical explanation for how this is aquired. Trained at a Imperial University, Studied by yourself, etc...

**Pure Combat Feats**

| Name                | Type   | Req                      | Cost | Description                         |
| ------------------- | ------ | ------------------------ | ---- | ----------------------------------- |
| Take Aim            | Combat | Gun 1+                   |      | Unlock Aim action                   |
| Disengage           | Combat | Melee 1+                 |      | Unlock Disengage action             |
| Grapple             | Combat | Melee 1+                 |      | Unlock Grapple action               |
| Disarm              | Combat | Melee 1+ or Gun 2+       |      | Unlock Disarm action                |
| Charge              | Combat | Melee 1+                 |      | Unlock Charge action                |
| Called Shot         | Combat | Gun 1+                   |      | Unlock Called Shot action           |
| Called Shot (Adv.)  | Combat | Called Shot & Gun 3+     |      | Unlock Called Shot (Adv.) action    |
| Inspiring Speech    | Combat | Tactics or leadership 0+ |      | Unlock Inspiring Speech action      |
| Sustained Fire      | Combat | Gun 2+                   |      | Unlock Full Auto Attack action      |
| Overwatch           | Combat | Gun 2+                   |      | Unlock Overwatch action             |
| Controlled Burst    | Combat | Gun 2+                   |      | Unlock Controlled Burst action      |
| Experienced Brawler | Combat | Total 10+                |      | Unlock Dodge action                 |
| Duelist             | Combat | Melee 1+                 |      | Unlock Parry action                 |
| Dive for Cover      | Combat | Athletics 1+             |      | Unlock Dive for Cover action        |
| Opportunist         | Combat | Melee 1+                 |      | Unlock Attack of Opportunity action |


**Non-Combat**

| Name                  | Type    | Req                                  | Cost | Description                                                                                                                                                                                          |
| --------------------- | ------- | ------------------------------------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Friendly Face         | General | Carouse 1+                           |      | After 1 hr socializing, you meet someone willing to do you a small favor or answer one reasonable question. Requires successful check, can also fail and be lied to.                                 |
| Smuggler              | General | Broker & Deception 1+                |      | Can smuggle one item anywhere with a deception check                                                                                                                                                 |
| Experienced Smuggler  | General | Smuggler feat, Deception & Broker 2+ |      | Can smuggle 3 items anywhere with a deception check                                                                                                                                                  |
| Bureaucratic Shortcut | General | Admin 1+                             |      | You may reduce the time required for one bureaucratic task by one step (days → hours → minutes)                                                                                                      |
| Know a Guy            | General | Streetwise 1+                        |      | Once per settlement, declare the existence of a local contact capable of providing one useful piece of information or arranging a minor illicit service. Takes several hours, and a successful roll. |
| Legal Objection       | General | Advocate 2+                          |      | When NPC attempts to arrest, search, or detain someone, cite a legal objection. With successful roll, attempt is ended.                                                                              |
| Polyglot              | General | Language 0+                          |      | Learn a new language of your choice.                                                                                                                                                                 |
| Quick Hack            | General | Electronics 1+                       |      | Lowers the time to hack a device by one degree, hours -> minutes -> seconds.                                                                                                                         |
| Combat Hack           | Combat  | Electronics 2+                       |      | Unlock Combat Hack action.                                                                                                                                                                           |
| Divide and Conquer    | Combat  | Persuade 1+                          |      | Apply confusion to X NPC's. X difficulty start at 8+, increase by 2 for each additional target.                                                                                                      |
| Diplomatic Gambit     | General | Diplomat 1+                          |      | Change the attitude of any NPC by one degree with a successful check, lowers with failure                                                                                                            |
| Keen Eye              | Combat  | Recon 0 or Total>=10                 |      | Unlock Identify Enemy action                                                                                                                                                                         |
| Combat Sprint         | Combat  | Athletics 2+                         |      | Unlock Combat Sprint action                                                                                                                                                                          |
| Count the Odds        | General | Gambling 1+                          |      | Once per session, after observing one round, you can immediately determine if the game is honest, manipulated, or fraudulent.                                                                        |
| Convincing Argument   | General | Persuade 2+                          |      | Once per session, you can convince any normal or rare NPC of your argument as long as it does not directly harms the NPC or his interests.                                                           |

## NPC classifications

| Rank      | Description                                                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal    | The most common form of NPC encountered. Regular goons. Will have 1-2 special features.                                                                    |
| Elite     | Slightly more rare to encounter. They are upgraded goons, police sergeants, or sicarios. Will have between 1-5 features.                                   |
| Legendary | Very unique NPC's, usually vital to the story. Represents strong opponents, capable of outstanding feats. Can have any number of unique features attached. |
#### NPC Catalog


| Name            | Rank      | Difficulty | Type  | Move     | HP  | Armor | Feature(Feats)                                                                                                                                                                                                         |
| --------------- | --------- | ---------- | ----- | -------- | --- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security Drone  | Normal    | Easy       | Drone | 18 (fly) | 12  | 2     | - Ranged (2) Auto Cannon, make 2 attacks, Dmg: 2D+1, no MAP<br>- Melee (1) Ram, Dmg: 3D<br>- Self Destruct (3), make a move then blow itself up, Dmg: 4D + fire (Dex DM 8+ to resist)                                  |
| The Rim Stalker | Legendary | Hard       | Beast | 12       | 30  | 0     | - Melee (1) claw, make 2 attacks, Dmg: 2D+1, End DM 6+ or prone.<br>- Melee (2) bite, Dmg: 4D<br>- Terrifying Cry, enemies has to succussed an INT check otherwise every attack gets 1 less damage dice. Lasts 1 turn. |

## Languages

| Name        | Description                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Common      | The common language, derived from English and acts as the universal trade language throughout the galaxy. Most people speak it.                                                       |
| High Gothic | The old language. Derived from Latin, mostly used by scholars, priests, and politicians.                                                                                              |
| Vrang       | The most common dialect of the Vargr language.                                                                                                                                        |
| Old Speak   | A pigeon language combining various forms of old earth languages, including English, French, Mandarin, and Spanish. Is commonly spoken throughout the sector on more remote outposts. |
| Ancient     | The language of the ancients, obscure and never spoken anywhere across the known galaxy. Only known by xenoarcheologists, and tomb raiders.                                           |




### Random Rules

Set up rules for grapple