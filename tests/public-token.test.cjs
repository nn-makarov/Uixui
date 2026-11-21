/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const {
  PUBLIC_TOKEN_TTL_MS,
  PublicTokenConfigError,
  createPublicTokenMaterial,
  derivePublicToken,
  getExistingPublicTokenReplay,
  hashPublicToken,
} = require("../.test-build/public-token.js")

const secret = "test-only-public-token-placeholder-1234567890"
const idempotencyKey = "stage4c-idempotency-key-1234567890"

test("token generation is deterministic by key and nonce", () => {
  const first = derivePublicToken(idempotencyKey, "nonce-a", secret)
  const second = derivePublicToken(idempotencyKey, "nonce-a", secret)
  const differentNonce = derivePublicToken(idempotencyKey, "nonce-b", secret)

  assert.equal(first, second)
  assert.notEqual(first, differentNonce)
  assert.equal(first.includes(idempotencyKey), false)
})

test("only a SHA-256 hash is persisted in token material", () => {
  const now = new Date("2026-11-21T12:00:00.000Z")
  const material = createPublicTokenMaterial(idempotencyKey, now, secret)

  assert.match(material.hash, /^[a-f0-9]{64}$/)
  assert.equal(material.hash, hashPublicToken(material.token))
  assert.notEqual(material.hash, material.token)
  assert.equal(material.expiresAt.getTime() - now.getTime(), PUBLIC_TOKEN_TTL_MS)
})

test("an active deterministic token can be replayed idempotently", () => {
  const material = createPublicTokenMaterial(idempotencyKey, new Date(), secret)
  const replay = getExistingPublicTokenReplay({
    publicTokenHash: material.hash,
    publicTokenNonce: material.nonce,
    publicTokenExpiresAt: material.expiresAt,
    idempotencyKey,
  }, new Date(), secret)

  assert.equal(replay, material.token)
})

test("legacy nonce-less orders cannot reconstruct the previous raw token", () => {
  const legacyToken = "legacy-token-for-stage4c-testing-123456"
  const active = {
    publicTokenHash: hashPublicToken(legacyToken),
    publicTokenNonce: null,
    publicTokenExpiresAt: new Date("2027-01-01T00:00:00.000Z"),
    idempotencyKey,
  }

  assert.equal(getExistingPublicTokenReplay(active, new Date("2026-12-01T00:00:00.000Z")), null)
  assert.equal(getExistingPublicTokenReplay(active, new Date("2027-01-02T00:00:00.000Z")), null)
})

test("missing secret fails closed", () => {
  assert.throws(
    () => derivePublicToken(idempotencyKey, "nonce-without-secret", ""),
    PublicTokenConfigError,
  )
})
