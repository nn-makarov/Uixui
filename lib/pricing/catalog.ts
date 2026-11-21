export type TariffPriceField =
  | "priceSofa2" | "priceSofa3" | "priceSofaCorner"
  | "priceArmchair" | "priceRecliner"
  | "priceMattressSingle" | "priceMattressDouble"
  | "priceChairSeat" | "priceChairBack"

export type CatalogItem = {
  category: string
  variant: string
  title: string
  priceField: TariffPriceField
}

// Справочник доступных вариантов
export const CATALOG: Record<string, Record<string, { title: string, priceField: TariffPriceField }>> = {
  SOFA: {
    sofa2: { title: "Диван 2-местный", priceField: "priceSofa2" },
    sofa3: { title: "Диван 3-местный", priceField: "priceSofa3" },
    corner: { title: "Диван угловой", priceField: "priceSofaCorner" },
  },
  ARMCHAIR: {
    armchair: { title: "Кресло обычное", priceField: "priceArmchair" },
    recliner: { title: "Кресло-реклайнер", priceField: "priceRecliner" },
  },
  MATTRESS: {
    single: { title: "Матрас односпальный", priceField: "priceMattressSingle" },
    double: { title: "Матрас двуспальный", priceField: "priceMattressDouble" },
  },
  CHAIR: {
    seat: { title: "Стул (сиденье)", priceField: "priceChairSeat" },
    back: { title: "Стул (сиденье + спинка)", priceField: "priceChairBack" },
  }
}