import "dotenv/config"
import assert from "node:assert/strict"
import test from "node:test"
import { mkdtemp, mkdir, rm, stat, utimes, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { hashPublicToken } from "@/lib/orders/public-token"
import { cleanupUploadStorage } from "@/lib/images/upload-cleanup"

const ROLLBACK = new Error("STAGE4D_CLEANUP_ROLLBACK")

async function exists(filePath: string) {
  try {
    await stat(filePath)
    return true
  } catch {
    return false
  }
}

test("expired and orphaned uploads are cleaned without touching linked files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "cleaning-upload-cleanup-"))
  try {
    await mkdir(root, { recursive: true })
    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const suffix = crypto.randomUUID()
        const order = await tx.order.create({
          data: {
            publicTokenHash: hashPublicToken(`cleanup-order-${suffix}`),
            publicTokenNonce: null,
            publicTokenIssuedAt: new Date(),
            publicTokenExpiresAt: new Date(Date.now() + 86_400_000),
            idempotencyKey: `cleanup-${suffix}`,
            customerName: "Cleanup Test",
            customerPhone: "+70000000000",
            address: "Cleanup test address",
            estimatedCleaning: 300_000,
            estimatedOutOfTown: 0,
            estimatedTotal: 300_000,
            tariffSnapshot: {},
          },
        })

        const now = new Date()
        const linkedKey = `linked-${suffix}.webp`
        const activeKey = `active-${suffix}.jpg`
        const expiredKey = `expired-${suffix}.png`
        const oldOrphanKey = `orphan-old-${suffix}.jpg`
        const freshOrphanKey = `orphan-fresh-${suffix}.jpg`
        const paths = Object.fromEntries([linkedKey, activeKey, expiredKey, oldOrphanKey, freshOrphanKey]
          .map((key) => [key, path.join(root, key)]))

        await Promise.all(Object.values(paths).map((filePath) => writeFile(filePath, "test")))
        const oldTime = new Date(now.getTime() - 48 * 60 * 60 * 1000)
        await utimes(paths[oldOrphanKey], oldTime, oldTime)

        await tx.orderPhoto.create({
          data: {
            orderId: order.id,
            storageKey: linkedKey,
            mimeType: "image/webp",
            size: 4,
          },
        })
        await tx.tempUpload.create({
          data: {
            storageKey: activeKey,
            sessionId: suffix,
            mimeType: "image/jpeg",
            size: 4,
            expiresAt: new Date(now.getTime() + 60_000),
          },
        })
        await tx.tempUpload.create({
          data: {
            storageKey: expiredKey,
            sessionId: suffix,
            mimeType: "image/png",
            size: 4,
            expiresAt: new Date(now.getTime() - 60_000),
          },
        })

        const result = await cleanupUploadStorage(tx, root, now)
        assert.equal(result.deletedExpired, 1)
        assert.equal(result.deletedOrphanedFiles, 1)
        assert.equal(await exists(paths[linkedKey]), true)
        assert.equal(await exists(paths[activeKey]), true)
        assert.equal(await exists(paths[expiredKey]), false)
        assert.equal(await exists(paths[oldOrphanKey]), false)
        assert.equal(await exists(paths[freshOrphanKey]), true)
        throw ROLLBACK
      }, { timeout: 20_000 })
    } catch (error) {
      if (error !== ROLLBACK) throw error
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
