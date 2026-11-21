import { isIP } from "node:net"
import { createHmac, timingSafeEqual } from "node:crypto"

export const DIRECT_IP_HEADER = "x-cleaning-direct-ip"
export const DIRECT_IP_SIGNATURE_HEADER = "x-cleaning-direct-ip-signature"

type ClientIpOptions = {
  trustProxy?: boolean
  trustedProxies?: string
  internalToken?: string
}

function normalizeIp(value: string | null | undefined) {
  if (!value) return null
  let ip = value.trim()
  if (!ip) return null

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.slice(0, ip.lastIndexOf(":"))
  }
  if (ip.startsWith("::ffff:") && isIP(ip.slice(7)) === 4) {
    ip = ip.slice(7)
  }
  return isIP(ip) ? ip.toLowerCase() : null
}

function ipv4ToNumber(ip: string) {
  return ip.split(".").reduce((result, part) => (result * 256) + Number(part), 0)
}

function isTrustedProxy(ip: string, configuredProxies: string) {
  const entries = configuredProxies
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)

  for (const entry of entries) {
    const [network, prefixValue] = entry.split("/")
    const normalizedNetwork = normalizeIp(network)
    if (!normalizedNetwork) continue

    if (prefixValue === undefined) {
      if (ip === normalizedNetwork) return true
      continue
    }

    const prefix = Number(prefixValue)
    if (isIP(ip) !== 4 || isIP(normalizedNetwork) !== 4 || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      continue
    }
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
    if ((ipv4ToNumber(ip) & mask) === (ipv4ToNumber(normalizedNetwork) & mask)) return true
  }

  return false
}

function hasValidDirectIpSignature(
  headers: Headers,
  directIp: string,
  internalToken: string | undefined,
) {
  const supplied = headers.get(DIRECT_IP_SIGNATURE_HEADER)
  if (!supplied || !internalToken) return false

  const expected = createHmac("sha256", internalToken).update(directIp).digest("hex")
  const expectedBuffer = Buffer.from(expected)
  const suppliedBuffer = Buffer.from(supplied)
  return expectedBuffer.length === suppliedBuffer.length
    && timingSafeEqual(expectedBuffer, suppliedBuffer)
}

export function resolveClientIp(
  headers: Headers,
  options: ClientIpOptions = {},
) {
  const rawDirectIp = headers.get(DIRECT_IP_HEADER)
  const directIp = normalizeIp(rawDirectIp)
  if (!directIp) return "unknown"
  if (!rawDirectIp || !hasValidDirectIpSignature(headers, rawDirectIp, options.internalToken)) return "unknown"

  if (!options.trustProxy || !isTrustedProxy(directIp, options.trustedProxies ?? "")) {
    return directIp
  }

  const forwardedHeader = headers.get("x-forwarded-for")
  if (!forwardedHeader) return directIp

  const forwardedParts = forwardedHeader.split(",")
  if (forwardedParts.some((value) => !value.trim())) return directIp

  const forwarded = forwardedParts.map((value) => normalizeIp(value))
  if (forwarded.some((value) => value === null)) return directIp

  let currentIp = directIp
  let clientIp = directIp

  for (let index = forwarded.length - 1; index >= 0; index -= 1) {
    if (!isTrustedProxy(currentIp, options.trustedProxies ?? "")) break
    clientIp = forwarded[index]!
    currentIp = clientIp
  }

  return clientIp
}

export function resolveRequestClientIp(req: Request) {
  return resolveClientIp(req.headers, {
    trustProxy: process.env.TRUST_PROXY === "true",
    trustedProxies: process.env.TRUSTED_PROXIES ?? "",
    internalToken: process.env.INTERNAL_CLIENT_IP_TOKEN,
  })
}
