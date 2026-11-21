import "dotenv/config"
import assert from "node:assert/strict"
import test from "node:test"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import {
  buildRateLimitKey,
  cleanupRateLimitCounters,
  consumeRateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit"
import { tooManyRequests } from "@/lib/security/rate-limit-response"
import { enforceRequestRateLimit } from "@/lib/security/request-rate-limit"

const ROLLBACK = new Error("STAGE4B_ROLLBACK")
const testSecret = "test-only-rate-limit-placeholder-1234567890"

async function withRollback(run: (tx: Prisma.TransactionClient) => Promise<void>) {
  try {
    await prisma.$transaction(async (tx) => {
      await run(tx)
      throw ROLLBACK
    }, { timeout: 30_000 })
  } catch (error) {
    if (error !== ROLLBACK) throw error
  }
}

test("PostgreSQL rate limit integration", async (suite) => {
  await suite.test("exceeding a limit returns Retry-After metadata", async () => {
    await withRollback(async (tx) => {
      const identity = `exceed-${crypto.randomUUID()}`
      const now = new Date("2026-11-21T12:00:00.000Z")
      const limit = RATE_LIMITS.orderCreate.limit
      let finalResult

      for (let index = 0; index < limit + 1; index += 1) {
        finalResult = await consumeRateLimit(tx, "orderCreate", identity, now, testSecret)
      }

      assert.equal(finalResult?.allowed, false)
      assert.equal(finalResult?.remaining, 0)
      assert.ok((finalResult?.retryAfterSeconds ?? 0) > 0)

      const response = tooManyRequests(finalResult!)
      assert.equal(response.status, 429)
      assert.equal(response.headers.get("Retry-After"), String(finalResult?.retryAfterSeconds))
      assert.equal(response.headers.get("Cache-Control"), "private, no-store")
    })
  })

  await suite.test("parallel PostgreSQL upserts cannot exceed the limit", async () => {
    await withRollback(async (tx) => {
      const identity = `parallel-${crypto.randomUUID()}`
      const now = new Date("2026-11-21T12:05:00.000Z")
      const limit = RATE_LIMITS.orderCreate.limit
      const attempts = await Promise.all(
        Array.from({ length: limit + 6 }, () =>
          consumeRateLimit(tx, "orderCreate", identity, now, testSecret)),
      )

      assert.equal(attempts.filter((result) => result.allowed).length, limit)
      assert.equal(attempts.filter((result) => !result.allowed).length, 6)
    })
  })

  await suite.test("a new window resets the counter", async () => {
    await withRollback(async (tx) => {
      const identity = `window-${crypto.randomUUID()}`
      const now = new Date("2026-11-21T12:10:00.000Z")
      const limit = RATE_LIMITS.login.limit

      for (let index = 0; index < limit; index += 1) {
        const result = await consumeRateLimit(tx, "login", identity, now, testSecret)
        assert.equal(result.allowed, true)
      }
      assert.equal(
        (await consumeRateLimit(tx, "login", identity, now, testSecret)).allowed,
        false,
      )

      const nextWindow = new Date(now.getTime() + (RATE_LIMITS.login.windowSeconds * 1000) + 1)
      assert.equal(
        (await consumeRateLimit(tx, "login", identity, nextWindow, testSecret)).allowed,
        true,
      )
    })
  })

  await suite.test("database keys do not contain raw identifiers", () => {
    const identity = "203.0.113.50"
    const key = buildRateLimitKey("login", identity, testSecret)
    assert.equal(key.includes(identity), false)
    assert.equal(key.length, 64)
  })

  await suite.test("email-scoped login bucket is softer but still atomic", async () => {
    await withRollback(async (tx) => {
      const normalizedEmail = `owner-${crypto.randomUUID()}@company.test`
      const now = new Date("2026-11-21T12:15:00.000Z")
      const limit = RATE_LIMITS.loginEmail.limit
      const attempts = await Promise.all(
        Array.from({ length: limit + 6 }, () =>
          consumeRateLimit(tx, "loginEmail", normalizedEmail, now, testSecret)),
      )

      assert.equal(attempts.filter((result) => result.allowed).length, limit)
      assert.equal(attempts.filter((result) => !result.allowed).length, 6)
      assert.equal(
        buildRateLimitKey("loginEmail", normalizedEmail, testSecret).includes(normalizedEmail),
        false,
      )
    })
  })

  await suite.test("old rate-limit windows are cleaned without touching current windows", async () => {
    await withRollback(async (tx) => {
      const now = new Date("2026-11-21T12:20:00.000Z")
      const key = `cleanup-${crypto.randomUUID()}`
      const freshKey = `${key}-fresh`
      await tx.rateLimitCounter.createMany({
        data: [
          { key, windowStart: new Date("2026-11-19T12:00:00.000Z"), count: 1 },
          { key: freshKey, windowStart: new Date("2026-11-21T12:00:00.000Z"), count: 1 },
        ],
      })

      const result = await cleanupRateLimitCounters(tx, now)
      const remaining = await tx.rateLimitCounter.findMany({
        where: { key: { in: [key, freshKey] } },
      })
      assert.equal(result.count, 1)
      assert.deepEqual(remaining.map((item) => item.key), [freshKey])
    })
  })

  await suite.test("unknown direct IP fails closed instead of sharing a spoofable bucket", async () => {
    const response = await enforceRequestRateLimit(
      new Request("http://localhost/api/orders/invalid"),
      "publicOrder",
    )
    assert.equal(response?.status, 503)
  })
})
