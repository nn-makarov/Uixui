/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const {
  CHECKOUT_DRAFT_STORAGE_KEY,
  CHECKOUT_DRAFT_TTL_MS,
  clearCheckoutDraft,
  createCheckoutFingerprint,
  emptyCheckoutFormData,
  loadCheckoutDraft,
  saveCheckoutDraft,
} = require("../.test-build/checkout-draft.js")

class MemoryStorage {
  values = new Map()

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null
  }

  setItem(key, value) {
    this.values.set(key, String(value))
  }

  removeItem(key) {
    this.values.delete(key)
  }
}

const formData = {
  ...emptyCheckoutFormData(),
  customerName: "Иван",
  customerPhone: "+7 999 000-00-00",
  address: "Москва, Тестовая улица, 1",
  desiredDate: "2026-11-25",
  desiredTime: "15:00",
  comment: "Позвонить заранее",
  outOfTown: true,
  consentPd: true,
}

const items = [{
  category: "SOFA",
  variant: "corner",
  quantity: 1,
  strongDirt: true,
  secondSide: false,
  needsPhotoQuote: false,
}]

test("checkout draft restores after reload", () => {
  const storage = new MemoryStorage()
  const savedAt = Date.now()
  const fingerprint = createCheckoutFingerprint(formData, items)
  const draft = {
    version: 1,
    idempotencyKey: "draft-key-12345678901234567890",
    fingerprint,
    formData,
    savedAt,
  }

  assert.equal(saveCheckoutDraft(storage, draft), true)
  assert.deepEqual(loadCheckoutDraft(storage, savedAt + 1000), draft)
})

test("photos are never serialized into localStorage", () => {
  const storage = new MemoryStorage()
  const draft = {
    version: 1,
    idempotencyKey: "draft-key-12345678901234567890",
    fingerprint: createCheckoutFingerprint(formData, items),
    formData,
    savedAt: Date.now(),
  }

  saveCheckoutDraft(storage, draft)
  const serialized = storage.getItem(CHECKOUT_DRAFT_STORAGE_KEY)

  assert.equal(serialized.includes("photos"), false)
  assert.equal(serialized.includes("base64"), false)
  assert.equal(serialized.includes("File"), false)
})

test("significant order changes produce a different fingerprint", () => {
  const first = createCheckoutFingerprint(formData, items)
  const changedForm = createCheckoutFingerprint({ ...formData, address: "Другой адрес" }, items)
  const changedItems = createCheckoutFingerprint(formData, [{ ...items[0], quantity: 2 }])

  assert.notEqual(first, changedForm)
  assert.notEqual(first, changedItems)
})

test("successful completion clears the checkout draft", () => {
  const storage = new MemoryStorage()
  saveCheckoutDraft(storage, {
    version: 1,
    idempotencyKey: "draft-key-12345678901234567890",
    fingerprint: createCheckoutFingerprint(formData, items),
    formData,
    savedAt: Date.now(),
  })

  clearCheckoutDraft(storage)
  assert.equal(storage.getItem(CHECKOUT_DRAFT_STORAGE_KEY), null)
})

test("corrupted or expired drafts do not break restoration", () => {
  const storage = new MemoryStorage()
  storage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, "{broken json")

  assert.equal(loadCheckoutDraft(storage), null)
  assert.equal(storage.getItem(CHECKOUT_DRAFT_STORAGE_KEY), null)

  const expired = {
    version: 1,
    idempotencyKey: "draft-key-12345678901234567890",
    fingerprint: createCheckoutFingerprint(formData, items),
    formData,
    savedAt: 1000,
  }
  storage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify(expired))
  assert.equal(loadCheckoutDraft(storage, 1000 + CHECKOUT_DRAFT_TTL_MS + 1), null)
})

test("an older tab cannot overwrite a newer draft", () => {
  const storage = new MemoryStorage()
  const base = {
    version: 1,
    idempotencyKey: "draft-key-12345678901234567890",
    fingerprint: createCheckoutFingerprint(formData, items),
    formData,
  }

  assert.equal(saveCheckoutDraft(storage, { ...base, savedAt: 2000 }), true)
  assert.equal(saveCheckoutDraft(storage, { ...base, formData: { ...formData, customerName: "Старое" }, savedAt: 1000 }), false)
  assert.equal(loadCheckoutDraft(storage, 2500).formData.customerName, "Иван")
})
