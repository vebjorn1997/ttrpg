import { createMiddleware } from 'hono/factory'

export type AuthVariables = {
  userId: string
  userRole: 'admin' | 'player'
}

/**
 * Require the shared internal key + identity headers from the Next.js BFF.
 * Catalog routes stay public; mount this only on character (and later admin write) routers.
 */
export const requireInternalAuth = createMiddleware<{
  Variables: AuthVariables
}>(async (c, next) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected) {
    console.error('INTERNAL_API_KEY is not configured')
    return c.json({ error: 'Server misconfigured' }, 500)
  }

  const key = c.req.header('x-internal-key')
  if (!key || key !== expected) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const userId = c.req.header('x-user-id')?.trim()
  const roleRaw = c.req.header('x-user-role')?.trim().toLowerCase()

  if (!userId) {
    return c.json({ error: 'Missing user identity' }, 401)
  }

  const userRole = roleRaw === 'admin' ? 'admin' : 'player'
  c.set('userId', userId)
  c.set('userRole', userRole)
  await next()
})

export function canAccessCharacter(
  role: 'admin' | 'player',
  requesterId: string,
  ownerId: string | null,
): boolean {
  if (role === 'admin') return true
  return ownerId != null && ownerId === requesterId
}

/**
 * Campaign world audiences. `visitor` is an unauthenticated reader — the
 * systems database is browsable signed-out, so identity is optional there.
 */
export type ViewerRole = 'admin' | 'player' | 'visitor'

export type ViewerVariables = {
  viewerId: string | null
  viewerRole: ViewerRole
}

/**
 * Resolve the caller without rejecting anonymous reads. Identity headers are
 * only believed when they arrive alongside the shared BFF key, so a direct
 * caller cannot promote itself past `visitor`.
 */
export const attachViewer = createMiddleware<{
  Variables: ViewerVariables
}>(async (c, next) => {
  const expected = process.env.INTERNAL_API_KEY
  const key = c.req.header('x-internal-key')
  const userId = c.req.header('x-user-id')?.trim()
  const roleRaw = c.req.header('x-user-role')?.trim().toLowerCase()

  if (expected && key === expected && userId) {
    c.set('viewerId', userId)
    c.set('viewerRole', roleRaw === 'admin' ? 'admin' : 'player')
  } else {
    c.set('viewerId', null)
    c.set('viewerRole', 'visitor')
  }

  await next()
})

/** The campaign's admin role doubles as Game Master. */
export function isGameMaster(role: ViewerRole): boolean {
  return role === 'admin'
}
