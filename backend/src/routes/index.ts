import { Hono } from 'hono'
import conditions from './conditions'
import actions from './actions'
import calledShots from './calledShots'
import criticalInjury from './criticalInjury'
import healing from './healing'
import feats from './feats'
import npcCatalog from './npcCatalog'

const api = new Hono()

api.route('/conditions', conditions)
api.route('/actions', actions)
api.route('/called-shots', calledShots)
api.route('/critical-injury', criticalInjury)
api.route('/healing', healing)
api.route('/feats', feats)
api.route('/npc-catalog', npcCatalog)

export default api
