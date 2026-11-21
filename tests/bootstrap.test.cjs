/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const {
  BootstrapConfigError,
  resolveBootstrapAdmin,
} = require("../.test-build/bootstrap.js")

const validPassword = "TEST_ONLY_Bootstrap_Password_92!"

test("bootstrap seed refuses missing credentials", () => {
  assert.throws(
    () => resolveBootstrapAdmin({}, "development"),
    BootstrapConfigError,
  )
})

test("bootstrap seed refuses weak credentials", () => {
  assert.throws(
    () => resolveBootstrapAdmin({ email: "owner@company.test", password: "short" }, "development"),
    BootstrapConfigError,
  )
  assert.throws(
    () => resolveBootstrapAdmin({ email: "owner@company.test", password: "onlylowercaseletters" }, "development"),
    BootstrapConfigError,
  )
})

test("bootstrap seed normalizes valid credentials", () => {
  assert.deepEqual(
    resolveBootstrapAdmin({ email: " Owner@Company.test ", password: validPassword }, "development"),
    { email: "owner@company.test", password: validPassword },
  )
})

test("production bootstrap refuses example domains", () => {
  assert.throws(
    () => resolveBootstrapAdmin({ email: "owner@example.com", password: validPassword }, "production"),
    BootstrapConfigError,
  )
})
