import { readdir, stat, unlink } from "node:fs/promises"
import type { Dirent } from "node:fs"
import path from "node:path"
import type { Prisma } from "@prisma/client"

type CleanupClient = Pick<Prisma.TransactionClient, "tempUpload" | "orderPhoto">

export async function cleanupUploadStorage(
  client: CleanupClient,
  root: string,
  now = new Date(),
  orphanGraceMs = 24 * 60 * 60 * 1000,
) {
  const expired = await client.tempUpload.findMany({
    where: { expiresAt: { lt: now } },
    select: { id: true, storageKey: true },
  })

  let deletedExpiredFiles = 0
  for (const upload of expired) {
    try {
      await unlink(path.join(root, path.basename(upload.storageKey)))
      deletedExpiredFiles += 1
    } catch {
      // Missing files are still removed from the database below.
    }
  }

  if (expired.length) {
    await client.tempUpload.deleteMany({ where: { id: { in: expired.map((item) => item.id) } } })
  }

  const [linkedPhotos, activeTemporaryUploads] = await Promise.all([
    client.orderPhoto.findMany({ select: { storageKey: true } }),
    client.tempUpload.findMany({ select: { storageKey: true } }),
  ])
  const referencedFiles = new Set(
    [...linkedPhotos, ...activeTemporaryUploads].map((item) => path.basename(item.storageKey)),
  )

  let entries: Dirent[] = []
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    entries = []
  }

  let deletedOrphanedFiles = 0
  for (const entry of entries) {
    if (!entry.isFile() || referencedFiles.has(entry.name)) continue
    const filePath = path.join(root, entry.name)
    try {
      const fileStat = await stat(filePath)
      if (now.getTime() - fileStat.mtimeMs < orphanGraceMs) continue
      await unlink(filePath)
      deletedOrphanedFiles += 1
    } catch {
      // Cleanup is best-effort; linked files were excluded above.
    }
  }

  return {
    deletedExpired: expired.length,
    deletedExpiredFiles,
    deletedOrphanedFiles,
  }
}
