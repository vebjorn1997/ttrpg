import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/aws-lambda'
import api from './routes'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  }),
)

app.route('/', api)

// Local dev only — skip this when running inside Lambda
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  serve({ fetch: app.fetch, port: 5000 })
}

export const handler = handle(app)