/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const {
  businessDateTimeToUtcIso,
  formatBusinessDateTime,
  getEditableBusinessDateTime,
  resolveBusinessDateTimeForSave,
} = require("../.test-build/date-time.js")

test("UTC 12:00 is displayed as 15:00 in Europe/Moscow", () => {
  const display = formatBusinessDateTime("2026-11-21T12:00:00.000Z", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })

  assert.equal(display, "15:00")
})

test("saving unchanged business time preserves the original UTC timestamp", () => {
  const originalUtc = "2026-11-21T12:00:00.000Z"
  const editable = getEditableBusinessDateTime(originalUtc)

  assert.deepEqual(editable, { date: "2026-11-21", time: "15:00" })
  assert.equal(
    resolveBusinessDateTimeForSave(originalUtc, editable.date, editable.time),
    originalUtc,
  )
})

test("business time crossing midnight converts to the previous UTC date", () => {
  const utc = businessDateTimeToUtcIso("2026-11-21", "00:30")

  assert.equal(utc, "2026-11-20T21:30:00.000Z")
  assert.deepEqual(getEditableBusinessDateTime(utc), {
    date: "2026-11-21",
    time: "00:30",
  })
})

test("invalid wall-clock values are rejected", () => {
  assert.throws(() => businessDateTimeToUtcIso("2026-02-30", "12:00"))
  assert.throws(() => businessDateTimeToUtcIso("2026-11-21", "24:00"))
})
