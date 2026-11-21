import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getOrderItemCategoryLabel, getOrderItemTitle } from "@/lib/order-display"
import { enforceRequestRateLimit } from "@/lib/security/request-rate-limit"
import { findActiveOrderByPublicToken } from "@/lib/orders/public-order-access"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const limited = await enforceRequestRateLimit(req, "publicOrder")
  if (limited) return limited

  try {
    const { token } = await params
    const order = await findActiveOrderByPublicToken(prisma, token)
    if (!order) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 })

    return NextResponse.json({
      status: order.status,
      customerName: order.customerName,
      address: order.address,
      estimatedTotal: order.estimatedTotal,
      estimatedCleaning: order.estimatedCleaning,
      estimatedOutOfTown: order.estimatedOutOfTown,
      hasPhotoRequest: order.hasPhotoRequest,
      finalPrice: order.finalPrice,
      agreedDateTime: order.agreedDateTime,
      items: order.items.map((item) => ({
        id: item.id,
        categoryLabel: getOrderItemCategoryLabel(item.category),
        title: getOrderItemTitle(item.category, item.variant),
        description: item.category === "OTHER" ? item.description : null,
        quantity: item.quantity,
        strongDirt: item.strongDirt,
        secondSide: item.secondSide,
        needsPhotoQuote: item.needsPhotoQuote,
        lineTotal: item.lineTotal,
      })),
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Ошибка получения заявки:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
