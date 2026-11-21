import type { OrderStatus } from "@prisma/client"

export class OrderAgreementError extends Error {
  readonly status = 400

  constructor(message = "Для статуса AGREED необходимо указать итоговую цену и согласованное время") {
    super(message)
    this.name = "OrderAgreementError"
  }
}

export function assertValidOrderAgreement(
  status: OrderStatus,
  finalPrice: number | null,
  agreedDateTime: Date | null,
) {
  if (status === "AGREED" && (finalPrice === null || agreedDateTime === null)) {
    throw new OrderAgreementError()
  }
}
