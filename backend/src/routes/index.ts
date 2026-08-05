import { Hono } from 'hono'
import conditions from './conditions'
import actions from './actions'
import calledShots from './calledShots'
import weaponsTraits from './weaponsTraits'
import criticalInjury from './criticalInjury'
import healing from './healing'
import feats from './feats'

const api = new Hono()

api.route('/conditions', conditions)
api.route('/actions', actions)
api.route('/called-shots', calledShots)
api.route('/weapons-traits', weaponsTraits)
api.route('/critical-injury', criticalInjury)
api.route('/healing', healing)
api.route('/feats', feats)

export default api
