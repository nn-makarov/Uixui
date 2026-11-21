import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { hasSameOrigin } from "@/lib/security/origin"

const companySchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  email: z.string().trim().email().or(z.literal("")).nullable().optional(),
  address: z.string().trim().max(200).nullable().optional(),
  serviceArea: z.string().trim().min(2).max(300),
  workingHours: z.string().trim().min(2).max(200),
  heroTitle: z.string().trim().min(2).max(200),
  heroSubtitle: z.string().trim().min(2).max(500),
  aboutText: z.string().trim().max(3000),
  privacyVersion: z.string().trim().min(1).max(30),
}).strict()

async function isOwner() {
  const session = await auth()
  return Boolean(session?.user && (session.user as { role?: string }).role === "OWNER")
}

export async function GET() {
  if (!await isOwner()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const company = await prisma.company.findUnique({ where: { id: "singleton" } })
  if (!company) return NextResponse.json({ error: "Настройки компании не найдены" }, { status: 404 })
  return NextResponse.json(company, { headers: { "Cache-Control": "private, no-store" } })
}

export async function PATCH(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: "Недопустимый источник запроса" }, { status: 403 })
  if (!await isOwner()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const data = companySchema.parse(await req.json())
    const updated = await prisma.company.update({ where: { id: "singleton" }, data })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    console.error("Ошибка сохранения компании:", error)
    return NextResponse.json({ error: "Не удалось сохранить настройки компании" }, { status: 500 })
  }
}
