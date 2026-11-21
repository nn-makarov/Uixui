import type { Prisma } from "@prisma/client"
import { calculateOrder, type RawCartItem } from "@/lib/pricing/calculate"
import {
  createPublicTokenMaterial,
  getExistingPublicTokenReplay,
  PublicTokenConfigError,
} from "@/lib/orders/public-token"

export type PublicOrderCreateData = {
  customerName: string
  customerPhone: string
  address: string
  desiredDate: string | null
  desiredTime: string | null
  comment?: string | null
  outOfTown: boolean
  uploadIds: string[]
  items: RawCartItem[]
}

type OrderCreateClient = Pick<Prisma.TransactionClient, "order" | "tariff" | "company" | "tempUpload">
type TransactionRunner = <T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T>
type ExistingOrderForReplay = Parameters<typeof getExistingPublicTokenReplay>[0]

export class OrderCreateError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "OrderCreateError"
  }
}

function replayExistingOrder(order: ExistingOrderForReplay) {
  try {
    const token = getExistingPublicTokenReplay(order)
    return token
      ? { token, status: 200 as const }
      : { token: null, status: 200 as const, reissueRequired: true as const }
  } catch (error) {
    if (error instanceof PublicTokenConfigError) {
      throw new OrderCreateError("Публичная ссылка временно недоступна", 503)
    }
    throw error
  }
}

export async function createPublicOrder(
  client: OrderCreateClient,
  runInTransaction: TransactionRunner,
  idempotencyKey: string,
  data: PublicOrderCreateData,
  uploadSessionId: string | undefined,
) {
  const existing = await client.order.findUnique({ where: { idempotencyKey } })
  if (existing) return replayExistingOrder(existing)

  const [tariff, company] = await Promise.all([
    client.tariff.findUnique({ where: { id: "singleton" } }),
    client.company.findUnique({ where: { id: "singleton" } }),
  ])
  if (!tariff || !company) {
    throw new OrderCreateError("Настройки сервиса не заполнены", 503)
  }

  const calc = calculateOrder(data.items, data.outOfTown, tariff)
  let publicToken: ReturnType<typeof createPublicTokenMaterial>
  try {
    publicToken = createPublicTokenMaterial(idempotencyKey)
  } catch (error) {
    if (error instanceof PublicTokenConfigError) {
      throw new OrderCreateError("Публичная ссылка временно недоступна", 503)
    }
    throw error
  }
  if (data.uploadIds.length && !uploadSessionId) {
    throw new OrderCreateError("Сессия загрузки фотографий истекла. Загрузите фото ещё раз.", 400)
  }

  try {
    await runInTransaction(async (tx) => {
      const uploads = data.uploadIds.length ? await tx.tempUpload.findMany({
        where: {
          id: { in: data.uploadIds },
          sessionId: uploadSessionId,
          expiresAt: { gt: new Date() },
        },
      }) : []
      if (uploads.length !== data.uploadIds.length) {
        throw new OrderCreateError("Фотографии устарели. Загрузите их ещё раз.", 400)
      }

      const createdOrder = await tx.order.create({
        data: {
          publicTokenHash: publicToken.hash,
          publicTokenNonce: publicToken.nonce,
          publicTokenIssuedAt: publicToken.issuedAt,
          publicTokenExpiresAt: publicToken.expiresAt,
          idempotencyKey,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          address: data.address,
          desiredDate: data.desiredDate ? new Date(`${data.desiredDate}T00:00:00`) : null,
          desiredTime: data.desiredTime,
          comment: data.comment || null,
          outOfTown: data.outOfTown,
          consentPdAt: new Date(),
          consentPdVersion: company.privacyVersion,
          estimatedCleaning: calc.estimatedCleaning,
          estimatedOutOfTown: calc.estimatedOutOfTown,
          estimatedTotal: calc.estimatedTotal,
          hasPhotoRequest: calc.hasPhotoRequest,
          tariffSnapshot: JSON.parse(JSON.stringify(tariff)),
          photos: {
            create: uploads.map((upload) => ({
              storageKey: upload.storageKey,
              mimeType: upload.mimeType,
              size: upload.size,
            })),
          },
          items: {
            create: calc.processedItems.map((item) => ({
              category: item.category,
              variant: item.variant,
              quantity: item.quantity,
              strongDirt: item.strongDirt,
              secondSide: item.secondSide,
              needsPhotoQuote: Boolean(item.needsPhotoQuote),
              description: item.description || null,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
      })

      if (uploads.length) {
        await tx.tempUpload.deleteMany({
          where: {
            id: { in: uploads.map((upload) => upload.id) },
            sessionId: uploadSessionId,
          },
        })
      }

      return createdOrder
    })

    return { token: publicToken.token, status: 201 as const }
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const racedOrder = await client.order.findUnique({ where: { idempotencyKey } })
      if (racedOrder) return replayExistingOrder(racedOrder)
    }
    throw error
  }
}
