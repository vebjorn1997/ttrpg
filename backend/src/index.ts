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
    allowHeaders: [
      'Content-Type',
      'Accept',
      'X-Internal-Key',
      'X-User-Id',
      'X-User-Role',
    ],
  }),
)

app.use('*', async (c, next) => {
  const started = Date.now()
  await next()
  const ms = Date.now() - started
  if (ms >= 50) {
    console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`)
  }
})

app.route('/', api)

// Local dev only — skip this when running inside Lambda
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const port = 5000
  // Bind IPv4 explicitly. Node's `localhost` lookup prefers IPv6 on Windows,
  // so callers (Next.js SSR) should use 127.0.0.1, not localhost.
  serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
    console.log(`API listening on http://127.0.0.1:${info.port}`)
  })
}

export const handler = handle(app)
