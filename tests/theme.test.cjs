/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { getNextTheme } = require("../.test-build/theme.js")

test("theme switching uses resolvedTheme when defaultTheme is system", () => {
  const savedTheme = "system"
  const resolvedWhenSystemIsLight = "light"
  const resolvedWhenSystemIsDark = "dark"

  assert.equal(savedTheme, "system")
  assert.equal(getNextTheme(resolvedWhenSystemIsLight), "dark")
  assert.equal(getNextTheme(resolvedWhenSystemIsDark), "light")
})
