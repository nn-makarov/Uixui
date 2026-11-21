import { NextResponse } from "next/server"
import { hasSameOrigin } from "@/lib/security/origin"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { OrderAgreementError } from "@/lib/orders/agreement"
import { applyAdminOrderUpdate } from "@/lib/orders/update"

const updateSchema = z.object({
  status: z.enum(["NEW", "AGREED", "COMPLETED", "CANCELLED"]).optional(),
  finalPrice: z.number().int().min(0).nullable().optional(),
  agreedDateTime: z.string().datetime().nullable().optional(),
  adminNotes: z.string().max(5000).nullable().optional(),
}).strict()

async function requireOwner() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "OWNER") return false
  return true
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireOwner()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        customerName: true,
        customerPhone: true,
        address: true,
        desiredDate: true,
        desiredTime: true,
        comment: true,
        outOfTown: true,
        estimatedCleaning: true,
        estimatedOutOfTown: true,
        estimatedTotal: true,
        finalPrice: true,
        agreedDateTime: true,
        adminNotes: true,
        createdAt: true,
        items: true,
        photos: { select: { id: true } },
      },
    })
    if (!order) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    return NextResponse.json(order, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Ошибка получения заявки:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: "Недопустимый источник запроса" }, { status: 403 })
  if (!await requireOwner()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { id } = await params
    const data = updateSchema.parse(await req.json())
    const updated = await applyAdminOrderUpdate(prisma, id, data)
    if (!updated) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    return NextResponse.json(updated, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    if (error instanceof OrderAgreementError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Ошибка обновления заявки:", error)
    return NextResponse.json({ error: "Не удалось сохранить изменения" }, { status: 500 })
  }
}
