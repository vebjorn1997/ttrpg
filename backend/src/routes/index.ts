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
import skills from './skills'
import tl from './tl'
import languages from './languages'
import lawlevel from './lawlevel'
import miscellaneous from './miscellaneous'
import equipment from './equipment'

const api = new Hono()

export const endpoints = [
  '/actions',
  '/conditions',
  '/called-shots',
  '/critical-injury',
  '/healing',
  '/feats',
  '/skills',
  '/npc-catalog',
  '/traits',
  '/characters',
  '/tl',
  '/languages',
  '/lawlevel',
  '/miscellaneous',
  '/equipment',
] as const

api.get('/', (c) => c.json({ status: 'ok', endpoints }))

api.route('/conditions', conditions)
api.route('/actions', actions)
api.route('/called-shots', calledShots)
api.route('/critical-injury', criticalInjury)
api.route('/healing', healing)
api.route('/feats', feats)
api.route('/skills', skills)
api.route('/npc-catalog', npcCatalog)
api.route('/traits', traits)
api.route('/characters', characters)
api.route('/tl', tl)
api.route('/languages', languages)
api.route('/lawlevel', lawlevel)
api.route('/miscellaneous', miscellaneous)
api.route('/equipment', equipment)

export default api
