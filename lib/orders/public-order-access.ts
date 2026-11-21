import type { Prisma } from "@prisma/client"
import { hashPublicToken } from "@/lib/orders/public-token"

type PublicOrderClient = Pick<Prisma.TransactionClient, "order">

export async function findActiveOrderByPublicToken(
  client: PublicOrderClient,
  token: string,
  now = new Date(),
) {
  if (!token || token.length < 32 || token.length > 100) return null

  const tokenHash = hashPublicToken(token)
  const order = await client.order.findUnique({
    where: { publicTokenHash: tokenHash },
    include: { items: true },
  })

  if (!order?.publicTokenExpiresAt || order.publicTokenExpiresAt <= now) return null
  return order
}
