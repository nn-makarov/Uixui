import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import path from "node:path"
import { prisma } from "@/lib/db"
import { cleanupUploadStorage } from "@/lib/images/upload-cleanup"
import { cleanupRateLimitCounters } from "@/lib/security/rate-limit"

export const runtime = "nodejs"

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = req.headers.get("authorization") || ""
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : ""
  if (!secret || !supplied) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const expectedBuffer = Buffer.from(secret)
  const suppliedBuffer = Buffer.from(supplied)
  if (expectedBuffer.length !== suppliedBuffer.length || !timingSafeEqual(expectedBuffer, suppliedBuffer)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const root = path.resolve(process.env.STORAGE_LOCAL_DIR || "./.storage", "uploads")
    const result = await cleanupUploadStorage(prisma, root)
    const rateLimitResult = await cleanupRateLimitCounters(prisma)
    return NextResponse.json({
      deleted: result.deletedExpired,
      deletedOrphanedFiles: result.deletedOrphanedFiles,
      deletedRateLimitCounters: rateLimitResult.count,
    })
  } catch (error) {
    console.error("Ошибка очистки временных загрузок:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
