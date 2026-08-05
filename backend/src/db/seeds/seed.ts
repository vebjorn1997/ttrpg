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
import { npcCatalogTable } from '../schema/npcCatalog';

const db = drizzle(process.env.DATABASE_URL!);

const seed = async () => {
    await db.insert(conditionsTable).values(conditions).onConflictDoNothing();
    await db.insert(actionsTable).values(actions).onConflictDoNothing();
    await db.insert(calledShotsTable).values(calledShots).onConflictDoNothing();
    await db.insert(traitsTable).values(traits).onConflictDoNothing();
    await db.insert(criticalInjuryTable).values(criticalInjury).onConflictDoNothing();
    await db.insert(healingTable).values(healing).onConflictDoNothing();
    await db.insert(featsTable).values(feats).onConflictDoNothing();

    // Resolve trait names → UUIDs, then insert NPCs
    const neededTraitNames = [...new Set(npcCatalog.flatMap((npc) => npc.traitNames))];
    const traitRows = neededTraitNames.length
        ? await db.select().from(traitsTable).where(inArray(traitsTable.name, neededTraitNames))
        : [];
    const traitIdByName = Object.fromEntries(traitRows.map((t) => [t.name, t.id]));

    await db.insert(npcCatalogTable).values(
        npcCatalog.map(({ traitNames, ...npc }) => ({
            ...npc,
            traits: traitNames.map((name) => traitIdByName[name]).filter(Boolean),
        })),
    ).onConflictDoNothing();

    process.exit(0);
}

seed();
