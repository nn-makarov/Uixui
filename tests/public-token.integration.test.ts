import "dotenv/config"
import assert from "node:assert/strict"
import test from "node:test"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { findActiveOrderByPublicToken } from "@/lib/orders/public-order-access"
import { hashPublicToken } from "@/lib/orders/public-token"
import { applyAdminOrderUpdate } from "@/lib/orders/update"

const ROLLBACK = new Error("STAGE4C_ROLLBACK")

async function withRollback(run: (tx: Prisma.TransactionClient) => Promise<void>) {
  try {
    await prisma.$transaction(async (tx) => {
      await run(tx)
      throw ROLLBACK
    }, { timeout: 20_000 })
  } catch (error) {
    if (error !== ROLLBACK) throw error
  }
}

async function createTokenOrder(
  tx: Prisma.TransactionClient,
  options: {
    tokenHash?: string
    expiresAt?: Date
  } = {},
) {
  const suffix = crypto.randomUUID()
  return tx.order.create({
    data: {
      publicTokenHash: options.tokenHash ?? hashPublicToken(`token-${suffix}`),
      publicTokenNonce: null,
      publicTokenIssuedAt: new Date("2026-11-21T12:00:00.000Z"),
      publicTokenExpiresAt: options.expiresAt ?? new Date("2027-02-19T12:00:00.000Z"),
      idempotencyKey: `stage4c-${suffix}`,
      customerName: "Stage 4C Test",
      customerPhone: "+70000000000",
      address: "Тестовый адрес Stage 4C",
      estimatedCleaning: 300_000,
      estimatedOutOfTown: 0,
      estimatedTotal: 300_000,
      tariffSnapshot: {},
    },
  })
}

test("public token integration", async (suite) => {
  await suite.test("active hash token resolves without storing the raw token", async () => {
    await withRollback(async (tx) => {
      const token = `active-${crypto.randomUUID()}-public-token`
      const order = await createTokenOrder(tx, { tokenHash: hashPublicToken(token) })
      const found = await findActiveOrderByPublicToken(tx, token, new Date("2026-12-01T00:00:00.000Z"))

      assert.equal(found?.id, order.id)
      assert.notEqual(order.publicTokenHash, token)
    })
  })

  await suite.test("invalid and expired tokens return no order", async () => {
    await withRollback(async (tx) => {
      const token = `expired-${crypto.randomUUID()}-public-token`
      const order = await createTokenOrder(tx, {
        tokenHash: hashPublicToken(token),
        expiresAt: new Date("2026-11-20T12:00:00.000Z"),
      })

      assert.equal(await findActiveOrderByPublicToken(tx, "wrong-token-value-that-is-long-enough-123456", new Date()), null)
      assert.equal(await findActiveOrderByPublicToken(tx, token, new Date("2026-11-21T12:00:00.000Z")), null)
      assert.ok(order.id)
    })
  })

  await suite.test("replacing the hash immediately invalidates the previous token", async () => {
    await withRollback(async (tx) => {
      const oldToken = `old-${crypto.randomUUID()}-public-token`
      const newToken = `new-${crypto.randomUUID()}-public-token`
      const order = await createTokenOrder(tx, { tokenHash: hashPublicToken(oldToken) })
      await tx.order.update({
        where: { id: order.id },
        data: {
          publicTokenHash: hashPublicToken(newToken),
          publicTokenExpiresAt: new Date("2027-02-19T12:00:00.000Z"),
        },
      })

      assert.equal(await findActiveOrderByPublicToken(tx, oldToken, new Date("2026-12-01T00:00:00.000Z")), null)
      assert.equal(
        (await findActiveOrderByPublicToken(tx, newToken, new Date("2026-12-01T00:00:00.000Z")))?.id,
        order.id,
      )
    })
  })

  await suite.test("admin update DTO never returns token fields", async () => {
    await withRollback(async (tx) => {
      const token = `admin-dto-${crypto.randomUUID()}-public-token`
      const order = await createTokenOrder(tx, { tokenHash: hashPublicToken(token) })
      const updated = await applyAdminOrderUpdate(tx, order.id, { adminNotes: "Stage 4C test" })
      const forbiddenKeys = [
        "publicToken",
        "publicTokenHash",
        "publicTokenNonce",
        "publicTokenIssuedAt",
        "publicTokenExpiresAt",
        "idempotencyKey",
        "tariffSnapshot",
      ]

      assert.ok(updated)
      assert.deepEqual(
        forbiddenKeys.filter((key) => Object.prototype.hasOwnProperty.call(updated, key)),
        [],
      )
    })
  })
})
