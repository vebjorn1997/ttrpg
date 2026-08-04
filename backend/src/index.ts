import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import api from './routes'

const app = new Hono()
app.route('/', api)

serve({ fetch: app.fetch, port: 5000 })

export const handler = handle(app)
