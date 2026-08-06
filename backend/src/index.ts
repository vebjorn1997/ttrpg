import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/aws-lambda'
import api from './routes'

const app = new Hono()

// The rules reference is public read-only data, so any origin may read it.
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'OPTIONS'] }))

app.route('/', api)

serve({ fetch: app.fetch, port: 5000 })

export const handler = handle(app)
