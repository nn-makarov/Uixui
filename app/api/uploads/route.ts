import { NextResponse } from "next/server"
import { hasSameOrigin } from "@/lib/security/origin"
import { randomUUID } from "node:crypto"
import { mkdir, writeFile, unlink } from "node:fs/promises"
import path from "node:path"
import { prisma } from "@/lib/db"
import { enforceRequestRateLimit } from "@/lib/security/request-rate-limit"
import {
  MAX_FILES,
  MAX_UPLOAD_BYTES,
  PhotoProcessingError,
  processUploadedPhoto,
} from "@/lib/images/photo-processing"

export const runtime = "nodejs"
const storageRoot = path.resolve(process.env.STORAGE_LOCAL_DIR || "./.storage", "uploads")

function getSessionId(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const match = cookie.match(/(?:^|;\s*)upload-session=([a-zA-Z0-9-]{20,80})/)
  return match?.[1] || randomUUID()
}

export async function POST(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: "Недопустимый источник запроса" }, { status: 403 })
  const limited = await enforceRequestRateLimit(req, "upload")
  if (limited) return limited
  const sessionId = getSessionId(req)
  const createdKeys: string[] = []
  try {
    const form = await req.formData()
    const files = form.getAll("files").filter((entry): entry is File => entry instanceof File)
    if (!files.length || files.length > MAX_FILES) {
      return NextResponse.json({ error: "Можно загрузить от 1 до 3 фотографий" }, { status: 400 })
    }

    await mkdir(storageRoot, { recursive: true })
    const uploaded = []
    for (const file of files) {
      if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new Error("Размер фотографии должен быть не более 5 МБ")
      const bytes = new Uint8Array(await file.arrayBuffer())
      const processed = await processUploadedPhoto(bytes)

      const storageKey = `${randomUUID()}.${processed.extension}`
      await writeFile(path.join(storageRoot, storageKey), processed.buffer, { flag: "wx", mode: 0o600 })
      createdKeys.push(storageKey)
      const upload = await prisma.tempUpload.create({
        data: {
          storageKey,
          sessionId,
          mimeType: processed.mimeType,
          size: processed.size,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      })
      uploaded.push({ id: upload.id, mimeType: upload.mimeType, size: upload.size })
    }

    const response = NextResponse.json({ uploads: uploaded })
    response.cookies.set("upload-session", sessionId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 })
    return response
  } catch (error) {
    if (createdKeys.length) await prisma.tempUpload.deleteMany({ where: { storageKey: { in: createdKeys } } }).catch(() => undefined)
    await Promise.all(createdKeys.map((key) => unlink(path.join(storageRoot, key)).catch(() => undefined)))
    const message = error instanceof PhotoProcessingError || error instanceof Error
      ? error.message
      : "Не удалось загрузить фотографии"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: "Недопустимый источник запроса" }, { status: 403 })
  const limited = await enforceRequestRateLimit(req, "upload")
  if (limited) return limited
  const sessionId = getSessionId(req)
  try {
    const body = await req.json()
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string") : []
    if (!ids.length || ids.length > MAX_FILES) return NextResponse.json({ error: "Некорректный список фотографий" }, { status: 400 })
    const uploads = await prisma.tempUpload.findMany({ where: { id: { in: ids }, sessionId } })
    await Promise.all(uploads.map((upload) => unlink(path.join(storageRoot, path.basename(upload.storageKey))).catch(() => undefined)))
    await prisma.tempUpload.deleteMany({ where: { id: { in: uploads.map((upload) => upload.id) }, sessionId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Не удалось удалить фотографии" }, { status: 500 })
  }
}
