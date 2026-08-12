import 'dotenv/config'
import { eq, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { hashPassword } from 'better-auth/crypto'
import { randomUUID } from 'node:crypto'
import { account, user } from '../schema/auth'
import { charactersTable } from '../schema/characters'

/**
 * Bootstrap the first admin account (and optionally claim orphan characters).
 *
 * Env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD (required)
 *   ADMIN_NAME (optional, default "Admin")
 *   CLAIM_ORPHAN_CHARACTERS=true — set characters.user_id for rows with null owner
 */
const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim() || 'Admin'

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD to seed an admin user.')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.')
    process.exit(1)
  }

  const db = drizzle(process.env.DATABASE_URL!)

  const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  let adminId = existing?.id

  if (existing) {
    if (existing.role !== 'admin') {
      await db.update(user).set({ role: 'admin' }).where(eq(user.id, existing.id))
      console.log(`Updated existing user ${email} to role=admin`)
    } else {
      console.log(`Admin already exists: ${email}`)
    }
  } else {
    adminId = randomUUID()
    const hashed = await hashPassword(password)
    const now = new Date()

    await db.insert(user).values({
      id: adminId,
      name,
      email,
      emailVerified: true,
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(account).values({
      id: randomUUID(),
      accountId: adminId,
      providerId: 'credential',
      userId: adminId,
      password: hashed,
      createdAt: now,
      updatedAt: now,
    })

    console.log(`Created admin user: ${email}`)
  }

  if (process.env.CLAIM_ORPHAN_CHARACTERS === 'true' && adminId) {
    const orphans = await db
      .select({ id: charactersTable.id })
      .from(charactersTable)
      .where(isNull(charactersTable.userId))

    if (orphans.length > 0) {
      await db
        .update(charactersTable)
        .set({ userId: adminId })
        .where(isNull(charactersTable.userId))
      console.log(`Claimed ${orphans.length} orphan character(s) for admin.`)
    } else {
      console.log('No orphan characters to claim.')
    }
  }

  process.exit(0)
}

seedAdmin().catch((err) => {
  console.error(err)
  process.exit(1)
})
