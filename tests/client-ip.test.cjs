/* eslint-disable @typescript-eslint/no-require-imports */
const test = require("node:test")
const assert = require("node:assert/strict")
const { createHmac } = require("node:crypto")
const {
  DIRECT_IP_HEADER,
  DIRECT_IP_SIGNATURE_HEADER,
  resolveClientIp,
} = require("../.test-build/client-ip.js")

const internalToken = "test-only-internal-ip-placeholder"

function signedHeaders(directIp, forwardedFor) {
  const headers = new Headers({
    [DIRECT_IP_HEADER]: directIp,
    [DIRECT_IP_SIGNATURE_HEADER]: createHmac("sha256", internalToken).update(directIp).digest("hex"),
  })
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor)
  return headers
}

test("TRUST_PROXY=false ignores spoofed forwarding headers", () => {
  const headers = signedHeaders("203.0.113.10", "198.51.100.200, 10.0.0.5")
  assert.equal(
    resolveClientIp(headers, {
      trustProxy: false,
      trustedProxies: "203.0.113.10",
      internalToken,
    }),
    "203.0.113.10",
  )
})

test("unsigned or attacker-modified direct IP headers are rejected", () => {
  const headers = new Headers({
    [DIRECT_IP_HEADER]: "198.51.100.50",
    [DIRECT_IP_SIGNATURE_HEADER]: "invalid",
    "x-forwarded-for": "127.0.0.1",
  })
  assert.equal(
    resolveClientIp(headers, { trustProxy: false, internalToken }),
    "unknown",
  )
})

test("forwarded headers are ignored when direct peer is not a trusted proxy", () => {
  const headers = signedHeaders("192.0.2.20", "198.51.100.20")
  assert.equal(
    resolveClientIp(headers, {
      trustProxy: true,
      trustedProxies: "10.0.0.0/8",
      internalToken,
    }),
    "192.0.2.20",
  )
})

test("trusted proxy chain returns the rightmost untrusted client", () => {
  const headers = signedHeaders(
    "10.0.0.10",
    "203.0.113.99, 198.51.100.25, 10.0.0.11",
  )
  assert.equal(
    resolveClientIp(headers, {
      trustProxy: true,
      trustedProxies: "10.0.0.0/24",
      internalToken,
    }),
    "198.51.100.25",
  )
})

test("IPv4-mapped IPv6 direct address is normalized", () => {
  const headers = signedHeaders("::ffff:127.0.0.1", "198.51.100.30")
  assert.equal(
    resolveClientIp(headers, { trustProxy: false, internalToken }),
    "127.0.0.1",
  )
})

test("invalid IP anywhere in a trusted forwarding chain falls back to direct peer", () => {
  const headers = signedHeaders(
    "10.0.0.10",
    "198.51.100.10, not-an-ip, 10.0.0.11",
  )
  assert.equal(
    resolveClientIp(headers, {
      trustProxy: true,
      trustedProxies: "10.0.0.0/24",
      internalToken,
    }),
    "10.0.0.10",
  )
})

test("an empty forwarding-chain element does not get silently filtered", () => {
  const headers = signedHeaders("10.0.0.10", "198.51.100.10,,10.0.0.11")
  assert.equal(
    resolveClientIp(headers, {
      trustProxy: true,
      trustedProxies: "10.0.0.0/24",
      internalToken,
    }),
    "10.0.0.10",
  )
})
