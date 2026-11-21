export const CHECKOUT_DRAFT_STORAGE_KEY = "cleaning-checkout-draft-v1"
export const CHECKOUT_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type CheckoutFormData = {
  customerName: string
  customerPhone: string
  address: string
  desiredDate: string
  desiredTime: string
  comment: string
  outOfTown: boolean
  consentPd: boolean
}

export type CheckoutDraftItem = {
  category: string
  variant: string
  quantity: number
  strongDirt: boolean
  secondSide: boolean
  needsPhotoQuote: boolean
  description?: string
}

export type CheckoutDraft = {
  version: 1
  idempotencyKey: string
  fingerprint: string
  formData: CheckoutFormData
  savedAt: number
}

export function emptyCheckoutFormData(): CheckoutFormData {
  return {
    customerName: "",
    customerPhone: "",
    address: "",
    desiredDate: "",
    desiredTime: "",
    comment: "",
    outOfTown: false,
    consentPd: false,
  }
}

export function createCheckoutIdempotencyKey() {
  return globalThis.crypto.randomUUID()
}

export function createCheckoutFingerprint(
  formData: CheckoutFormData,
  items: CheckoutDraftItem[],
) {
  const normalizedItems = items
    .map((item) => ({
      category: item.category,
      variant: item.variant,
      quantity: item.quantity,
      strongDirt: item.strongDirt,
      secondSide: item.secondSide,
      needsPhotoQuote: Boolean(item.needsPhotoQuote),
      description: item.description ?? "",
    }))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))

  return JSON.stringify({
    customerName: formData.customerName,
    customerPhone: formData.customerPhone,
    address: formData.address,
    desiredDate: formData.desiredDate,
    desiredTime: formData.desiredTime,
    comment: formData.comment,
    outOfTown: formData.outOfTown,
    items: normalizedItems,
  })
}

function isValidFormData(value: unknown): value is CheckoutFormData {
  if (!value || typeof value !== "object") return false
  const data = value as Record<string, unknown>
  const stringFields = [
    "customerName",
    "customerPhone",
    "address",
    "desiredDate",
    "desiredTime",
    "comment",
  ]

  return stringFields.every((field) => typeof data[field] === "string")
    && typeof data.outOfTown === "boolean"
    && typeof data.consentPd === "boolean"
}

function isValidDraft(value: unknown): value is CheckoutDraft {
  if (!value || typeof value !== "object") return false
  const draft = value as Record<string, unknown>

  return draft.version === 1
    && typeof draft.idempotencyKey === "string"
    && draft.idempotencyKey.length >= 20
    && typeof draft.fingerprint === "string"
    && typeof draft.savedAt === "number"
    && Number.isFinite(draft.savedAt)
    && isValidFormData(draft.formData)
}

function parseDraft(raw: string | null) {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isValidDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function loadCheckoutDraft(storage: Pick<Storage, "getItem" | "removeItem">, now = Date.now()) {
  try {
    const raw = storage.getItem(CHECKOUT_DRAFT_STORAGE_KEY)
    const draft = parseDraft(raw)
    if (!draft) {
      if (raw) storage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
      return null
    }

    const age = now - draft.savedAt
    if (age < 0 || age > CHECKOUT_DRAFT_TTL_MS) {
      storage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
      return null
    }
    return draft
  } catch {
    return null
  }
}

export function saveCheckoutDraft(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  draft: CheckoutDraft,
) {
  try {
    const existing = parseDraft(storage.getItem(CHECKOUT_DRAFT_STORAGE_KEY))
    if (existing && existing.savedAt > draft.savedAt) return false
    storage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export function clearCheckoutDraft(storage: Pick<Storage, "removeItem">) {
  try {
    storage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}
