import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { inArray } from 'drizzle-orm';
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

const db = drizzle(process.env.DATABASE_URL!);

const seed = async () => {
    await db.insert(conditionsTable).values(conditions).onConflictDoNothing();
    await db.insert(actionsTable).values(actions).onConflictDoNothing();
    await db.insert(calledShotsTable).values(calledShots).onConflictDoNothing();
    await db.insert(traitsTable).values(traits).onConflictDoNothing();
    await db.insert(criticalInjuryTable).values(criticalInjury).onConflictDoNothing();
    await db.insert(healingTable).values(healing).onConflictDoNothing();
    await db.insert(featsTable).values(feats).onConflictDoNothing();

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
