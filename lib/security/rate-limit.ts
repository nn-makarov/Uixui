import { createHmac } from "node:crypto"
import type { Prisma } from "@prisma/client"

export const RATE_LIMITS = {
  login: { limit: 10, windowSeconds: 15 * 60 },
  loginEmail: { limit: 30, windowSeconds: 15 * 60 },
  orderCreate: { limit: 8, windowSeconds: 10 * 60 },
  upload: { limit: 12, windowSeconds: 10 * 60 },
  publicOrder: { limit: 120, windowSeconds: 60 },
} as const

export type RateLimitScope = keyof typeof RATE_LIMITS

type RateLimitClient = Pick<Prisma.TransactionClient, "rateLimitCounter">

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

export class RateLimitConfigError extends Error {
  constructor() {
    super("RATE_LIMIT_SECRET или AUTH_SECRET не задан")
    this.name = "RateLimitConfigError"
  }
}

function getHashSecret(secret?: string) {
  const value = secret ?? process.env.RATE_LIMIT_SECRET ?? process.env.AUTH_SECRET
  if (!value) throw new RateLimitConfigError()
  return value
}

export function buildRateLimitKey(scope: string, identity: string, secret?: string) {
  return createHmac("sha256", getHashSecret(secret))
    .update(`${scope}\0${identity}`)
    .digest("hex")
}

export async function consumeRateLimit(
  client: RateLimitClient,
  scope: RateLimitScope,
  identity: string,
  now = new Date(),
  secret?: string,
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[scope]
  const windowMs = config.windowSeconds * 1000
  const nowMs = now.getTime()
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs
  const windowStart = new Date(windowStartMs)
  const key = buildRateLimitKey(scope, identity, secret)

  const counter = await client.rateLimitCounter.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  })

  const windowEndMs = windowStartMs + windowMs
  return {
    allowed: counter.count <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - counter.count),
    retryAfterSeconds: Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000)),
  }
}

export async function cleanupRateLimitCounters(
  client: Pick<Prisma.TransactionClient, "rateLimitCounter">,
  now = new Date(),
  retentionMs = 24 * 60 * 60 * 1000,
) {
  return client.rateLimitCounter.deleteMany({
    where: {
      windowStart: { lt: new Date(now.getTime() - retentionMs) },
    },
  })
}
