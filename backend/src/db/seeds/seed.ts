import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, inArray, and, isNull } from 'drizzle-orm';
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
import systems from './systems';
import {
    systemsTable,
    systemTraitsTable,
    systemHooksTable,
    systemInteractionsTable,
    systemTimelineTable,
} from '../schema/systems';
import factions from './factions';
import { factionsTable, factionTraitsTable } from '../schema/factions';

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

    // Sample star systems. Existing rows are left alone so a re-run never
    // overwrites campaign edits, and child records are only written on insert.
    if (systems.length) {
        const systemTraitNames = [...new Set(systems.flatMap((s) => s.traitNames))];
        const systemTraitRows = systemTraitNames.length
            ? await db
                  .select()
                  .from(traitsTable)
                  .where(inArray(traitsTable.name, systemTraitNames))
            : [];
        const systemTraitIdByName = Object.fromEntries(
            systemTraitRows.map((t) => [t.name, t.id]),
        );

        for (const system of systems) {
            const [inserted] = await db
                .insert(systemsTable)
                .values({
                    name: system.name,
                    description: system.description,
                    techLevel: system.techLevel,
                    lawLevel: system.lawLevel,
                    location: system.location,
                    notes: system.notes,
                })
                .onConflictDoNothing()
                .returning({ id: systemsTable.id });

            if (!inserted) continue;

            const links = system.traitNames
                .map((name) => systemTraitIdByName[name])
                .filter(Boolean)
                .map((traitId) => ({ systemId: inserted.id, traitId }));
            if (links.length) {
                await db.insert(systemTraitsTable).values(links).onConflictDoNothing();
            }

            if (system.hooks.length) {
                await db.insert(systemHooksTable).values(
                    system.hooks.map((hook) => ({
                        systemId: inserted.id,
                        title: hook.title,
                        description: hook.description,
                        used: hook.used,
                    })),
                );
            }

            if (system.interactions.length) {
                await db.insert(systemInteractionsTable).values(
                    system.interactions.map((entry) => ({
                        systemId: inserted.id,
                        entryDate: entry.entryDate,
                        entryDateRaw: entry.entryDateRaw,
                        event: entry.event,
                    })),
                );
            }

            if (system.timeline.length) {
                await db.insert(systemTimelineTable).values(
                    system.timeline.map((entry) => ({
                        systemId: inserted.id,
                        entryDate: entry.entryDate,
                        entryDateRaw: entry.entryDateRaw,
                        event: entry.event,
                        visibility: entry.visibility,
                    })),
                );
            }
        }
    }

    // Campaign factions. Existing rows are left alone so a re-run never
    // overwrites campaign edits, and trait links are only written on insert.
    if (factions.length) {
        const factionTraitNames = [...new Set(factions.flatMap((f) => f.traitNames))];
        const headquartersNames = [
            ...new Set(
                factions
                    .map((f) => f.headquartersName)
                    .filter((name): name is string => Boolean(name)),
            ),
        ];

        const [factionTraitRows, headquartersRows] = await Promise.all([
            factionTraitNames.length
                ? db
                      .select()
                      .from(traitsTable)
                      .where(inArray(traitsTable.name, factionTraitNames))
                : Promise.resolve([]),
            headquartersNames.length
                ? db
                      .select({ id: systemsTable.id, name: systemsTable.name })
                      .from(systemsTable)
                      .where(inArray(systemsTable.name, headquartersNames))
                : Promise.resolve([]),
        ]);

        const factionTraitIdByName = Object.fromEntries(
            factionTraitRows.map((t) => [t.name, t.id]),
        );
        const systemIdByName = Object.fromEntries(
            headquartersRows.map((s) => [s.name, s.id]),
        );

        for (const name of headquartersNames) {
            if (!systemIdByName[name]) {
                throw new Error(
                    `factions seed: headquarters system "${name}" was not found`,
                );
            }
        }

        for (const faction of factions) {
            const [inserted] = await db
                .insert(factionsTable)
                .values({
                    name: faction.name,
                    type: faction.type,
                    description: faction.description,
                    tier: faction.tier,
                    headquartersSystemId: faction.headquartersName
                        ? systemIdByName[faction.headquartersName]
                        : null,
                    goals: faction.goals,
                    assets: faction.assets,
                    notes: faction.notes,
                })
                .onConflictDoNothing()
                .returning({ id: factionsTable.id });

            if (!inserted) continue;

            const links = faction.traitNames
                .map((traitName) => factionTraitIdByName[traitName])
                .filter(Boolean)
                .map((traitId) => ({ factionId: inserted.id, traitId }));
            if (links.length) {
                await db.insert(factionTraitsTable).values(links).onConflictDoNothing();
            }
        }
    }

    // Systems are inserted before factions exist, so control has to be wired
    // in a second pass. Only unclaimed worlds are filled so GM edits stick.
    const controllerNames = [
        ...new Set(
            systems
                .map((s) => s.controllerName)
                .filter((name): name is string => Boolean(name)),
        ),
    ];
    if (controllerNames.length) {
        const controllerFactionRows = await db
            .select({ id: factionsTable.id, name: factionsTable.name })
            .from(factionsTable)
            .where(inArray(factionsTable.name, controllerNames));
        const factionIdByName = Object.fromEntries(
            controllerFactionRows.map((f) => [f.name, f.id]),
        );

        for (const name of controllerNames) {
            if (!factionIdByName[name]) {
                throw new Error(
                    `systems seed: controller faction "${name}" was not found`,
                );
            }
        }

        for (const system of systems) {
            if (!system.controllerName) continue;
            await db
                .update(systemsTable)
                .set({ controllerFactionId: factionIdByName[system.controllerName] })
                .where(
                    and(
                        eq(systemsTable.name, system.name),
                        isNull(systemsTable.controllerFactionId),
                    ),
                );
        }
    }

    // Headquarters worlds default to their faction if still unclaimed.
    const headquarters = await db
        .select({
            factionId: factionsTable.id,
            systemId: factionsTable.headquartersSystemId,
        })
        .from(factionsTable);
    for (const row of headquarters) {
        if (!row.systemId) continue;
        await db
            .update(systemsTable)
            .set({ controllerFactionId: row.factionId })
            .where(
                and(
                    eq(systemsTable.id, row.systemId),
                    isNull(systemsTable.controllerFactionId),
                ),
            );
    }

    process.exit(0);
}

seed();
