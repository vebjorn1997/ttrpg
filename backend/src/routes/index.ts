import { Hono } from 'hono'
import conditions from './conditions'
import actions from './actions'
import calledShots from './calledShots'
import criticalInjury from './criticalInjury'
import healing from './healing'
import feats from './feats'
import npcCatalog from './npcCatalog'
import traits from './traits'
import characters from './characters'

const api = new Hono()

export const endpoints = [
  '/actions',
  '/conditions',
  '/called-shots',
  '/critical-injury',
  '/healing',
  '/feats',
  '/npc-catalog',
  '/traits',
  '/characters',
] as const

api.get('/', (c) => c.json({ status: 'ok', endpoints }))

api.route('/conditions', conditions)
api.route('/actions', actions)
api.route('/called-shots', calledShots)
api.route('/critical-injury', criticalInjury)
api.route('/healing', healing)
api.route('/feats', feats)
api.route('/npc-catalog', npcCatalog)
api.route('/traits', traits)
api.route('/characters', characters)

export default api
