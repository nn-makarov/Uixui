import "dotenv/config"
import assert from "node:assert/strict"
import test from "node:test"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { findActiveOrderByPublicToken } from "@/lib/orders/public-order-access"
import { reissuePublicOrderLink } from "@/lib/orders/public-token-reissue"
import {
  PUBLIC_TOKEN_TTL_MS,
  hashPublicToken,
} from "@/lib/orders/public-token"

const ROLLBACK = new Error("STAGE4C_REISSUE_ROLLBACK")

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

async function createReissueOrder(tx: Prisma.TransactionClient) {
  const suffix = crypto.randomUUID()
  const oldToken = `phase-a-legacy-${suffix}`
  const order = await tx.order.create({
    data: {
      publicTokenHash: hashPublicToken(oldToken),
      publicTokenNonce: null,
      publicTokenIssuedAt: new Date("2026-11-21T12:00:00.000Z"),
      publicTokenExpiresAt: new Date("2027-02-19T12:00:00.000Z"),
      idempotencyKey: `reissue-${suffix}`,
      customerName: "Reissue Test",
      customerPhone: "+70000000000",
      address: "Reissue test address",
      estimatedCleaning: 300_000,
      estimatedOutOfTown: 0,
      estimatedTotal: 300_000,
      tariffSnapshot: {},
    },
  })
  return { order, oldToken }
}

test("public link reissue integration", async (suite) => {
  await suite.test("reissue invalidates the previous token and activates a 90-day token", async () => {
    await withRollback(async (tx) => {
      const { order, oldToken } = await createReissueOrder(tx)
      const now = new Date("2026-11-21T13:00:00.000Z")
      const reissued = await reissuePublicOrderLink(tx, order.id, now)

      assert.ok(reissued)
      assert.equal(
        reissued.expiresAt.getTime() - now.getTime(),
        PUBLIC_TOKEN_TTL_MS,
      )
      assert.equal(await findActiveOrderByPublicToken(tx, oldToken, now), null)
      assert.equal(
        (await findActiveOrderByPublicToken(tx, reissued.token, now))?.id,
        order.id,
      )
      const stored = await tx.order.findUnique({
        where: { id: order.id },
        select: {
          publicTokenHash: true,
          publicTokenNonce: true,
          publicTokenExpiresAt: true,
        },
      })
      assert.equal(stored?.publicTokenHash, hashPublicToken(reissued.token))
      assert.ok(stored?.publicTokenNonce)
      assert.equal(stored?.publicTokenExpiresAt?.getTime(), reissued.expiresAt.getTime())
    })
  })

  await suite.test("a second reissue invalidates the first reissued token", async () => {
    await withRollback(async (tx) => {
      const { order } = await createReissueOrder(tx)
      const first = await reissuePublicOrderLink(tx, order.id)
      const second = await reissuePublicOrderLink(tx, order.id)

      assert.ok(first)
      assert.ok(second)
      assert.notEqual(first.token, second.token)
      assert.equal(await findActiveOrderByPublicToken(tx, first.token), null)
      assert.equal(
        (await findActiveOrderByPublicToken(tx, second.token))?.id,
        order.id,
      )
    })
  })
})
