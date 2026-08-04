import { Hono } from 'hono'
import conditions from './conditions'
import actions from './actions'

const api = new Hono()

api.route('/conditions', conditions)
api.route('/actions', actions)

export default api
