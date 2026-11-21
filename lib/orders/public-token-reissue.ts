import { Prisma } from "@prisma/client"
import { createPublicTokenMaterial } from "@/lib/orders/public-token"

type ReissueClient = Pick<Prisma.TransactionClient, "order" | "$queryRaw">

export async function reissuePublicOrderLink(
  client: ReissueClient,
  orderId: string,
  now = new Date(),
) {
  const locked = await client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "Order"
    WHERE "id" = ${orderId}
    FOR UPDATE
  `)
  if (!locked.length) return null

  const order = await client.order.findUnique({
    where: { id: orderId },
    select: { id: true, idempotencyKey: true },
  })
  if (!order) return null

  const material = createPublicTokenMaterial(
    order.idempotencyKey ?? `order:${order.id}`,
    now,
  )
  await client.order.update({
    where: { id: order.id },
    data: {
      publicTokenHash: material.hash,
      publicTokenNonce: material.nonce,
      publicTokenIssuedAt: material.issuedAt,
      publicTokenExpiresAt: material.expiresAt,
    },
    select: { id: true },
  })

  return {
    token: material.token,
    expiresAt: material.expiresAt,
  }
}
