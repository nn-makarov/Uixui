import { CATALOG } from "@/lib/pricing/catalog"

const CATEGORY_LABELS: Record<string, string> = {
  SOFA: "Диваны",
  ARMCHAIR: "Кресла",
  MATTRESS: "Матрасы",
  CHAIR: "Стулья",
  OTHER: "Другая мебель",
}

export function getOrderItemCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? "Мебель"
}

export function getOrderItemTitle(category: string, variant: string) {
  if (category === "OTHER") return "Другая мебель"
  return CATALOG[category]?.[variant]?.title ?? "Услуга по чистке"
}
