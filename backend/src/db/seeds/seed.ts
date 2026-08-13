import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, inArray } from 'drizzle-orm';
import conditions from './conditions';
import actions from './actions';
import calledShots from './calledShots';
import criticalInjury from './criticalInjury';
import traits from './traits';
import healing from './healing';
import feats from './feats';
import npcCatalog from './npcCatalog';
import { actionsTable } from '../schema/actions';
import { conditionsTable } from '../schema/conditions';
import { calledShotsTable } from '../schema/calledShots';
import { criticalInjuryTable } from '../schema/criticalInjury';
import { healingTable } from '../schema/healing';
import { featsTable } from '../schema/feats';
import { traitsTable } from '../schema/traits';
import { npcCatalogTable, npcCatalogTraitsTable } from '../schema/npcCatalog';
import skills from './skills';
import { skillsTable } from '../schema/skills';
import tl from './tl';
import { tlTable } from '../schema/tl';
import languages from './languages';
import { languagesTable } from '../schema/languages';
import lawlevel from './lawlevel';
import { lawlevelTable } from '../schema/lawlevel';
import miscellaneous from './miscellaneous';
import { miscellaneousTable } from '../schema/miscellaneous';
import equipment from './equipment';
import { equipmentTable } from '../schema/equipment';

const db = drizzle(process.env.DATABASE_URL!);

const seed = async () => {
    await db.insert(conditionsTable).values(conditions).onConflictDoNothing();
    await db.insert(actionsTable).values(
        actions.map(({ requiredFeatName: _requiredFeatName, ...action }) => action),
    ).onConflictDoNothing();
    await db.insert(calledShotsTable).values(calledShots).onConflictDoNothing();
    await db.insert(traitsTable).values(traits).onConflictDoNothing();
    for (const trait of traits) {
        await db
            .update(traitsTable)
            .set({
                type: trait.type,
                description: trait.description,
                color: trait.color,
            })
            .where(eq(traitsTable.name, trait.name));
    }
    await db.insert(criticalInjuryTable).values(criticalInjury).onConflictDoNothing();
    await db.insert(healingTable).values(healing).onConflictDoNothing();
    await db.insert(featsTable).values(feats).onConflictDoNothing();
    // Refresh structured requirements / display text on existing feat rows
    for (const feat of feats) {
        await db
            .update(featsTable)
            .set({
                prerequisites: feat.prerequisites,
                requirements: feat.requirements,
                description: feat.description,
                type: feat.type,
                cost: feat.cost,
            })
            .where(eq(featsTable.name, feat.name));
    }
    await db.insert(skillsTable).values(skills).onConflictDoNothing();
    await db.insert(tlTable).values(tl).onConflictDoNothing();
    for (const entry of tl) {
        await db
            .update(tlTable)
            .set({
                level: entry.level,
                description: entry.description,
            })
            .where(eq(tlTable.name, entry.name));
    }
    await db.insert(languagesTable).values(languages).onConflictDoNothing();
    for (const entry of languages) {
        await db
            .update(languagesTable)
            .set({ description: entry.description })
            .where(eq(languagesTable.name, entry.name));
    }
    await db.insert(lawlevelTable).values(lawlevel).onConflictDoNothing();
    for (const entry of lawlevel) {
        await db
            .update(lawlevelTable)
            .set({
                lawlevel: entry.lawlevel,
                description: entry.description,
            })
            .where(eq(lawlevelTable.name, entry.name));
    }
    await db.insert(miscellaneousTable).values(miscellaneous).onConflictDoNothing();
    for (const entry of miscellaneous) {
        await db
            .update(miscellaneousTable)
            .set({
                sort: entry.sort,
                description: entry.description,
            })
            .where(eq(miscellaneousTable.name, entry.name));
    }
    if (equipment.length > 0) {
        await db.insert(equipmentTable).values(equipment).onConflictDoNothing();
        for (const item of equipment) {
            await db
                .update(equipmentTable)
                .set({
                    cost: item.cost,
                    category: item.category,
                    type: item.type,
                    trait: item.trait,
                    weaponClassification: item.weaponClassification,
                    description: item.description,
                    tl: item.tl,
                    dmg: item.dmg,
                    armor: item.armor,
                    mag: item.mag,
                    range: item.range,
                })
                .where(eq(equipmentTable.name, item.name));
        }
    }

    // Resolve action → required feat names to UUIDs and backfill FKs
    const actionsWithFeat = actions.filter(
        (action): action is typeof action & { requiredFeatName: string } =>
            Boolean(action.requiredFeatName),
    );
    const actionNames = actionsWithFeat.map((a) => a.name);
    const featNames = [...new Set(actionsWithFeat.map((a) => a.requiredFeatName))];

    if (actionNames.length) {
        const [actionRows, featRows] = await Promise.all([
            db.select().from(actionsTable).where(inArray(actionsTable.name, actionNames)),
            db.select().from(featsTable).where(inArray(featsTable.name, featNames)),
        ]);

        const actionIdByName = Object.fromEntries(actionRows.map((a) => [a.name, a.id]));
        const featIdByName = Object.fromEntries(featRows.map((f) => [f.name, f.id]));

        for (const action of actionsWithFeat) {
            const actionId = actionIdByName[action.name];
            const featId = featIdByName[action.requiredFeatName];
            if (!actionId || !featId) continue;
            await db
                .update(actionsTable)
                .set({ requiredFeatId: featId })
                .where(eq(actionsTable.id, actionId));
        }
    }

    // Insert NPCs without trait links (traitNames is seed-only, not a DB column)
    await db.insert(npcCatalogTable).values(
        npcCatalog.map(({ traitNames: _traitNames, ...npc }) => npc),
    ).onConflictDoNothing();

    // Resolve trait / NPC names → UUIDs, then fill the join table
    const neededTraitNames = [...new Set(npcCatalog.flatMap((npc) => npc.traitNames))];
    const npcNames = npcCatalog.map((npc) => npc.name);

    const [traitRows, npcRows] = await Promise.all([
        neededTraitNames.length
            ? db.select().from(traitsTable).where(inArray(traitsTable.name, neededTraitNames))
            : Promise.resolve([]),
        db.select().from(npcCatalogTable).where(inArray(npcCatalogTable.name, npcNames)),
    ]);

    const traitIdByName = Object.fromEntries(traitRows.map((t) => [t.name, t.id]));
    const npcIdByName = Object.fromEntries(npcRows.map((n) => [n.name, n.id]));

    const traitLinks = npcCatalog.flatMap((npc) =>
        npc.traitNames
            .map((name) => ({
                npcCatalogId: npcIdByName[npc.name],
                traitId: traitIdByName[name],
            }))
            .filter((link) => link.npcCatalogId && link.traitId),
    );

    if (traitLinks.length) {
        await db.insert(npcCatalogTraitsTable).values(traitLinks).onConflictDoNothing();
    }

    process.exit(0);
}

seed();
