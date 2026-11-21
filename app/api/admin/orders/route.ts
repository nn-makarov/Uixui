import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "OWNER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const whereClause: Prisma.OrderWhereInput = {}
    if (status && status !== "ALL") whereClause.status = status as "NEW" | "AGREED" | "COMPLETED" | "CANCELLED"
    if (search) {
      whereClause.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        status: true,
        estimatedTotal: true,
        createdAt: true,
        _count: { select: { items: true } }
      }
    })

    return NextResponse.json(orders, { headers: { "Cache-Control": "private, no-store" } })
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
