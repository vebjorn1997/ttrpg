import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { actionsTable } from '../db/schema/actions'
import { featsTable } from '../db/schema/feats'

const actions = new Hono()

actions.get('/', async (c) => {
  const rows = await db
    .select({
      action: actionsTable,
      feat: {
        id: featsTable.id,
        name: featsTable.name,
      },
    })
    .from(actionsTable)
    .leftJoin(featsTable, eq(actionsTable.requiredFeatId, featsTable.id))

  const result = rows.map(({ action, feat }) => {
    const { requiredFeatId: _requiredFeatId, ...rest } = action
    return {
      ...rest,
      requiredFeat: feat?.id ? { id: feat.id, name: feat.name } : null,
    }
  })

  return c.json(result)
})

export default actions
