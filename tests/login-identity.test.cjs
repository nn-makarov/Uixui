/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const {
  extractLoginEmail,
  normalizeLoginEmail,
} = require("../.test-build/login-identity.js")

test("login email is normalized without changing identity semantics", () => {
  assert.equal(normalizeLoginEmail("  Owner@Example.COM "), "owner@example.com")
  assert.equal(normalizeLoginEmail(""), null)
  assert.equal(normalizeLoginEmail("x".repeat(255)), null)
})

test("the last callback email field is used without account lookup", async () => {
  const body = new URLSearchParams()
  body.append("email", "ignored@example.test")
  body.append("email", " Owner@Example.COM ")
  const req = new Request("http://localhost/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  })

  assert.equal(await extractLoginEmail(req), "owner@example.com")
})

test("an unreadable callback body skips only the email bucket", async () => {
  const req = new Request("http://localhost/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  })

  assert.equal(await extractLoginEmail(req), null)
})
