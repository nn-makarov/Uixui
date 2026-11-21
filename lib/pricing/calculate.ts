import { CATALOG, TariffPriceField } from "./catalog"

export type RawCartItem = {
  category: string
  variant: string
  quantity: number
  strongDirt: boolean
  secondSide: boolean
  needsPhotoQuote?: boolean
  description?: string
}

type Tariff = {
  minOrder: number
  strongDirtPercent: number
  mattressSecondSidePercent: number
  outOfTownFee: number
  priceSofa2: number
  priceSofa3: number
  priceSofaCorner: number
  priceArmchair: number
  priceRecliner: number
  priceMattressSingle: number
  priceMattressDouble: number
  priceChairSeat: number
  priceChairBack: number
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PricingError"
  }
}

export function calculateOrder(items: RawCartItem[], outOfTown: boolean, tariff: Tariff) {
  if (!items.length) throw new PricingError("Корзина пуста")

  let knownCleaningTotal = 0
  let hasPhotoRequest = false
  const processedItems: Array<RawCartItem & { unitPrice: number | null; lineTotal: number | null; title: string }> = []

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) {
      throw new PricingError("Количество должно быть от 1 до 50")
    }

    if (item.category === "OTHER") {
      if (item.variant !== "other") throw new PricingError("Неизвестный тип услуги «Другое»")
      if (!item.description?.trim()) throw new PricingError("Укажите, какую мебель нужно почистить")
      hasPhotoRequest = true
      processedItems.push({ ...item, needsPhotoQuote: true, unitPrice: null, lineTotal: null, title: "Другая мебель — по фото" })
      continue
    }

    const catalogItem = CATALOG[item.category]?.[item.variant]
    if (!catalogItem) throw new PricingError("В заказе обнаружен неизвестный тип мебели")

    const basePrice = tariff[catalogItem.priceField as TariffPriceField]
    if (!Number.isInteger(basePrice) || basePrice < 0) throw new PricingError("Для выбранной услуги не настроена цена")

    let multiplier = 1
    if (item.strongDirt) multiplier += tariff.strongDirtPercent / 100
    if (item.secondSide) {
      if (item.category !== "MATTRESS") throw new PricingError("Вторая сторона доступна только для матраса")
      multiplier += tariff.mattressSecondSidePercent / 100
    }

    const lineTotal = Math.round(basePrice * item.quantity * multiplier)
    knownCleaningTotal += lineTotal
    processedItems.push({ ...item, needsPhotoQuote: false, unitPrice: basePrice, lineTotal, title: catalogItem.title })
  }

  // Минимальный заказ применяется к известной части; фото-оценка не превращается в бесплатную услугу.
  const hasKnownItems = processedItems.some((item) => !item.needsPhotoQuote)
  const estimatedCleaning = hasKnownItems ? Math.max(knownCleaningTotal, tariff.minOrder) : 0
  const estimatedOutOfTown = outOfTown ? tariff.outOfTownFee : 0

  return {
    estimatedCleaning,
    estimatedOutOfTown,
    estimatedTotal: estimatedCleaning + estimatedOutOfTown,
    hasPhotoRequest,
    processedItems,
  }
}
