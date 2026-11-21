/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const {
  SAME_ORIGIN_REQUEST_HEADER,
  SAME_ORIGIN_REQUEST_VALUE,
  hasSameOrigin,
} = require("../.test-build/origin.js")

test("explicit same-origin request header is accepted", () => {
  const request = new Request("https://cleaning.example/api/orders", {
    method: "POST",
    headers: { [SAME_ORIGIN_REQUEST_HEADER]: SAME_ORIGIN_REQUEST_VALUE },
  })

  assert.equal(hasSameOrigin(request), true)
})

test("same-origin browser requests may omit Origin", () => {
  const request = new Request("https://cleaning.example/api/orders", {
    method: "POST",
    headers: { "sec-fetch-site": "same-origin" },
  })

  assert.equal(hasSameOrigin(request), true)
})

test("cross-site browser requests without Origin are rejected", () => {
  const request = new Request("https://cleaning.example/api/orders", {
    method: "POST",
    headers: { "sec-fetch-site": "cross-site" },
  })

  assert.equal(hasSameOrigin(request), false)
})

test("requests stripped of Origin, Fetch Metadata and the request header are rejected", () => {
  assert.equal(
    hasSameOrigin(new Request("https://cleaning.example/api/orders", {
      method: "POST",
      headers: { host: "cleaning.example" },
    })),
    false,
  )
})

test("an explicit Origin must match the request URL", () => {
  assert.equal(
    hasSameOrigin(new Request("https://cleaning.example/api/orders", {
      method: "POST",
      headers: {
        host: "cleaning.example",
        origin: "https://evil.example",
      },
    })),
    false,
  )
  assert.equal(
    hasSameOrigin(new Request("https://cleaning.example/api/orders", {
      method: "POST",
      headers: {
        host: "cleaning.example",
        origin: "https://cleaning.example",
      },
    })),
    true,
  )
})
