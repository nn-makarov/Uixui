import { NextResponse } from "next/server"
import { hasSameOrigin } from "@/lib/security/origin"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"

const tariffSchema = z.object({
  priceSofa2: z.number().int().min(0).max(100_000_000),
  priceSofa3: z.number().int().min(0).max(100_000_000),
  priceSofaCorner: z.number().int().min(0).max(100_000_000),
  priceArmchair: z.number().int().min(0).max(100_000_000),
  priceRecliner: z.number().int().min(0).max(100_000_000),
  priceMattressSingle: z.number().int().min(0).max(100_000_000),
  priceMattressDouble: z.number().int().min(0).max(100_000_000),
  priceChairSeat: z.number().int().min(0).max(100_000_000),
  priceChairBack: z.number().int().min(0).max(100_000_000),
  minOrder: z.number().int().min(0).max(100_000_000),
  outOfTownFee: z.number().int().min(0).max(100_000_000),
  strongDirtPercent: z.number().int().min(0).max(500),
  mattressSecondSidePercent: z.number().int().min(0).max(500),
}).strict()

async function isOwner() {
  const session = await auth()
  return Boolean(session?.user && (session.user as { role?: string }).role === "OWNER")
}

export async function GET() {
  if (!await isOwner()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const tariff = await prisma.tariff.findUnique({ where: { id: "singleton" } })
  if (!tariff) return NextResponse.json({ error: "Тарифы не настроены" }, { status: 404 })
  return NextResponse.json(tariff, { headers: { "Cache-Control": "private, no-store" } })
}

export async function PATCH(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: "Недопустимый источник запроса" }, { status: 403 })
  if (!await isOwner()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const payload = tariffSchema.parse(await req.json())
    const updated = await prisma.tariff.update({ where: { id: "singleton" }, data: payload })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    console.error("Ошибка сохранения тарифов:", error)
    return NextResponse.json({ error: "Не удалось сохранить тарифы" }, { status: 500 })
  }
}
