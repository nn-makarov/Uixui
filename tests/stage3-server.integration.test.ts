import "dotenv/config"
import assert from "node:assert/strict"
import test from "node:test"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { OrderAgreementError } from "@/lib/orders/agreement"
import { createPublicOrder } from "@/lib/orders/create"
import { hashPublicToken } from "@/lib/orders/public-token"
import { applyAdminOrderUpdate } from "@/lib/orders/update"

process.env.PUBLIC_TOKEN_SECRET ??= "test-only-public-token-placeholder-1234567890"

const ROLLBACK = new Error("STAGE3_ROLLBACK")

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

function validOrderPayload() {
  return {
    customerName: "Stage 3 Test",
    customerPhone: "+70000000000",
    address: "Тестовый адрес, 1",
    desiredDate: "2026-12-01",
    desiredTime: "15:00",
    comment: "Изолированный тест",
    outOfTown: false,
    consentPd: true,
    uploadIds: [],
    items: [{
      category: "SOFA",
      variant: "sofa2",
      quantity: 1,
      strongDirt: false,
      secondSide: false,
      needsPhotoQuote: false,
    }],
  }
}

async function createAdminTestOrder(
  tx: Prisma.TransactionClient,
  data: {
    status?: "NEW" | "AGREED"
    finalPrice?: number | null
    agreedDateTime?: Date | null
  } = {},
) {
  const suffix = crypto.randomUUID()
  const token = `stage3-admin-token-${suffix}`
  return tx.order.create({
    data: {
      publicTokenHash: hashPublicToken(token),
      publicTokenNonce: null,
      publicTokenIssuedAt: new Date(),
      publicTokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      idempotencyKey: `stage3-admin-${suffix}`,
      status: data.status ?? "NEW",
      customerName: "Stage 3 Admin Test",
      customerPhone: "+70000000001",
      address: "Тестовый адрес, 2",
      finalPrice: data.finalPrice ?? null,
      agreedDateTime: data.agreedDateTime ?? null,
      estimatedCleaning: 300_000,
      estimatedOutOfTown: 0,
      estimatedTotal: 300_000,
      tariffSnapshot: {},
    },
  })
}

test("Stage 3 server integration", async (suite) => {
  await suite.test("repeating the same idempotency key returns the existing order", async () => {
    const key = `stage3-idempotency-${crypto.randomUUID()}`

    await withRollback(async (tx) => {
      const runInTransaction = <T>(callback: (client: Prisma.TransactionClient) => Promise<T>) => callback(tx)
      const first = await createPublicOrder(tx, runInTransaction, key, validOrderPayload(), undefined)
      const second = await createPublicOrder(tx, runInTransaction, key, validOrderPayload(), undefined)
      const count = await tx.order.count({ where: { idempotencyKey: key } })
      const stored = await tx.order.findUnique({
        where: { idempotencyKey: key },
        select: {
          publicTokenHash: true,
          publicTokenNonce: true,
          publicTokenExpiresAt: true,
        },
      })

      assert.equal(first.status, 201)
      assert.equal(second.status, 200)
      assert.equal(second.token, first.token)
      assert.equal(count, 1)
      assert.match(stored?.publicTokenHash ?? "", /^[a-f0-9]{64}$/)
      assert.ok(stored?.publicTokenNonce)
      assert.ok(stored?.publicTokenExpiresAt && stored.publicTokenExpiresAt > new Date())
    })

    assert.equal(await prisma.order.count({ where: { idempotencyKey: key } }), 0)
  })

  await suite.test("a lost response followed by retry does not create a duplicate order", async () => {
    const key = `stage3-lost-response-${crypto.randomUUID()}`

    await withRollback(async (tx) => {
      const runInTransaction = <T>(callback: (client: Prisma.TransactionClient) => Promise<T>) => callback(tx)
      const first = await createPublicOrder(tx, runInTransaction, key, validOrderPayload(), undefined)
      assert.equal(first.status, 201)

      // Simulate that the browser did not receive the first response and retries.
      const retry = await createPublicOrder(tx, runInTransaction, key, validOrderPayload(), undefined)
      const count = await tx.order.count({ where: { idempotencyKey: key } })

      assert.equal(retry.status, 200)
      assert.equal(count, 1)
      assert.equal(typeof retry.token, "string")
    })
  })

  await suite.test("AGREED invariant uses the final state of partial updates", async () => {
    await withRollback(async (tx) => {
    const noPriceOrTime = await createAdminTestOrder(tx)
    await assert.rejects(
      applyAdminOrderUpdate(tx, noPriceOrTime.id, { status: "AGREED" }),
      OrderAgreementError,
    )

    const priceOnly = await createAdminTestOrder(tx, { finalPrice: 500_000 })
    await assert.rejects(
      applyAdminOrderUpdate(tx, priceOnly.id, { status: "AGREED" }),
      OrderAgreementError,
    )

    const timeOnly = await createAdminTestOrder(tx, {
      agreedDateTime: new Date("2026-12-01T12:00:00.000Z"),
    })
    await assert.rejects(
      applyAdminOrderUpdate(tx, timeOnly.id, { status: "AGREED" }),
      OrderAgreementError,
    )

    const complete = await createAdminTestOrder(tx)
    const agreed = await applyAdminOrderUpdate(tx, complete.id, {
      status: "AGREED",
      finalPrice: 500_000,
      agreedDateTime: "2026-12-01T12:00:00.000Z",
    })
    assert.equal(agreed?.status, "AGREED")

    const withNotes = await applyAdminOrderUpdate(tx, complete.id, { adminNotes: "Новая заметка" })
    assert.equal(withNotes?.status, "AGREED")

    await assert.rejects(
      applyAdminOrderUpdate(tx, complete.id, { finalPrice: null }),
      OrderAgreementError,
    )
    await assert.rejects(
      applyAdminOrderUpdate(tx, complete.id, { agreedDateTime: null }),
      OrderAgreementError,
    )

    const completed = await applyAdminOrderUpdate(tx, complete.id, { status: "COMPLETED" })
    assert.equal(completed?.status, "COMPLETED")
    })
  })
})
