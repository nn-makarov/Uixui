import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { hasSameOrigin } from "@/lib/security/origin"
import { PublicTokenConfigError } from "@/lib/orders/public-token"
import { reissuePublicOrderLink } from "@/lib/orders/public-token-reissue"

async function requireOwner() {
  const session = await auth()
  return Boolean(session?.user && (session.user as { role?: string }).role === "OWNER")
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasSameOrigin(req)) {
    return NextResponse.json({ error: "Недопустимый источник запроса" }, { status: 403 })
  }
  if (!await requireOwner()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const result = await prisma.$transaction(
      (tx) => reissuePublicOrderLink(tx, id),
      { timeout: 10_000 },
    )
    if (!result) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 })
    }
    return NextResponse.json({
      token: result.token,
      expiresAt: result.expiresAt.toISOString(),
    }, {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    if (error instanceof PublicTokenConfigError) {
      return NextResponse.json(
        { error: "Публичная ссылка временно недоступна" },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      )
    }
    console.error("Ошибка перевыпуска публичной ссылки")
    return NextResponse.json(
      { error: "Не удалось перевыпустить публичную ссылку" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    )
  }
}
