import type { OrderStatus, Prisma } from "@prisma/client"
import { assertValidOrderAgreement } from "@/lib/orders/agreement"

export type AdminOrderUpdate = {
  status?: OrderStatus
  finalPrice?: number | null
  agreedDateTime?: string | null
  adminNotes?: string | null
}

type OrderClient = Pick<Prisma.TransactionClient, "order">

export async function applyAdminOrderUpdate(
  client: OrderClient,
  id: string,
  data: AdminOrderUpdate,
) {
  const current = await client.order.findUnique({
    where: { id },
    select: { id: true, status: true, finalPrice: true, agreedDateTime: true },
  })
  if (!current) return null

  const finalPrice = data.finalPrice === undefined ? current.finalPrice : data.finalPrice
  const agreedDateTime = data.agreedDateTime === undefined
    ? current.agreedDateTime
    : data.agreedDateTime === null
      ? null
      : new Date(data.agreedDateTime)
  const effectiveStatus = data.status ?? current.status

  assertValidOrderAgreement(effectiveStatus, finalPrice, agreedDateTime)

  return client.order.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.finalPrice !== undefined ? { finalPrice: data.finalPrice } : {}),
      ...(data.agreedDateTime !== undefined ? { agreedDateTime } : {}),
      ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
    },
    select: {
      id: true,
      status: true,
      finalPrice: true,
      agreedDateTime: true,
      adminNotes: true,
    },
  })
}
