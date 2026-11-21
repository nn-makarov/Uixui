/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { calculateOrder, PricingError } = require("../.test-build/calculate.js")

const tariff = {
  priceSofa2: 250000,
  priceSofa3: 350000,
  priceSofaCorner: 450000,
  priceArmchair: 150000,
  priceRecliner: 200000,
  priceMattressSingle: 180000,
  priceMattressDouble: 250000,
  priceChairSeat: 80000,
  priceChairBack: 120000,
  minOrder: 300000,
  strongDirtPercent: 30,
  mattressSecondSidePercent: 50,
  outOfTownFee: 100000,
}
const sofa = { category: "SOFA", variant: "sofa2", quantity: 1, strongDirt: false, secondSide: false }
const other = { category: "OTHER", variant: "other", quantity: 1, strongDirt: false, secondSide: false, description: "Пуф" }

test("minimum order applies to known cleaning items", () => {
  const result = calculateOrder([sofa], false, tariff)
  assert.equal(result.estimatedCleaning, 300000)
  assert.equal(result.estimatedTotal, 300000)
})

test("strong dirt surcharge and out-of-town fee are calculated separately", () => {
  const result = calculateOrder([{ ...sofa, strongDirt: true }], true, tariff)
  assert.equal(result.estimatedCleaning, 325000)
  assert.equal(result.estimatedOutOfTown, 100000)
  assert.equal(result.estimatedTotal, 425000)
})

test("photo-only order is not incorrectly charged the minimum", () => {
  const result = calculateOrder([other], false, tariff)
  assert.equal(result.estimatedCleaning, 0)
  assert.equal(result.hasPhotoRequest, true)
  assert.equal(result.processedItems[0].lineTotal, null)
})

test("mixed order applies minimum only to known services", () => {
  const result = calculateOrder([sofa, other], false, tariff)
  assert.equal(result.estimatedCleaning, 300000)
  assert.equal(result.processedItems.length, 2)
})

test("unknown furniture variants are rejected, not silently omitted", () => {
  assert.throws(() => calculateOrder([{ ...sofa, category: "UNKNOWN" }], false, tariff), PricingError)
})

test("second-side surcharge is only valid for mattresses", () => {
  assert.throws(() => calculateOrder([{ ...sofa, secondSide: true }], false, tariff), PricingError)
})

test("unknown other-service variant is rejected", () => {
  assert.throws(() => calculateOrder([{ ...other, variant: "unknown" }], false, tariff), PricingError)
})

test("quantity is limited to 1..50", () => {
  assert.throws(() => calculateOrder([{ ...sofa, quantity: 51 }], false, tariff), PricingError)
})
