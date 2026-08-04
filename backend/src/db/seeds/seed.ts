import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import conditions from './conditions';
import actions from './actions';
import calledShots from './calledShots';
import criticalInjury from './criticalInjury';
import weaponsTraits from './weaponsTraits';
import healing from './healing';
import { actionsTable } from '../schema/actions';
import { conditionsTable } from '../schema/conditions';
import { calledShotsTable } from '../schema/calledShots';
import { weaponsTraitsTable } from '../schema/weaponsTraits';
import { criticalInjuryTable } from '../schema/criticalInjury';
import { healingTable } from '../schema/healing';

const db = drizzle(process.env.DATABASE_URL!);

const seed = async () => {
    await db.insert(conditionsTable).values(conditions).onConflictDoNothing();
    await db.insert(actionsTable).values(actions).onConflictDoNothing();
    await db.insert(calledShotsTable).values(calledShots).onConflictDoNothing();
    await db.insert(weaponsTraitsTable).values(weaponsTraits).onConflictDoNothing();
    await db.insert(criticalInjuryTable).values(criticalInjury).onConflictDoNothing();
    await db.insert(healingTable).values(healing).onConflictDoNothing();
    process.exit(0);
}

seed();