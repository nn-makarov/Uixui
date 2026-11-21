import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ALLOWED_PHOTO_MIME_TYPES } from "@/lib/images/photo-processing"

export const runtime = "nodejs"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { id } = await params
    const orderId = new URL(req.url).searchParams.get("orderId")
    if (!orderId) return NextResponse.json({ error: "Фото не найдено" }, { status: 404 })
    const photo = await prisma.orderPhoto.findFirst({ where: { id, orderId } })
    if (!photo) return NextResponse.json({ error: "Фото не найдено" }, { status: 404 })
    if (!ALLOWED_PHOTO_MIME_TYPES.has(photo.mimeType)) {
      return NextResponse.json({ error: "Фото не найдено" }, { status: 404 })
    }
    const root = path.resolve(process.env.STORAGE_LOCAL_DIR || "./.storage", "uploads")
    const filePath = path.join(root, path.basename(photo.storageKey))
    const bytes = await readFile(filePath)
    return new Response(bytes, { headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": `inline; filename="photo.${photo.mimeType === "image/jpeg" ? "jpg" : photo.mimeType === "image/png" ? "png" : "webp"}"`,
    } })
  } catch {
    return NextResponse.json({ error: "Не удалось открыть фото" }, { status: 404 })
  }
}
