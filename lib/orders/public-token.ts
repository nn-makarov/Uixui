import { createHash, createHmac, randomBytes } from "node:crypto"

export const PUBLIC_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000

export class PublicTokenConfigError extends Error {
  constructor() {
    super("PUBLIC_TOKEN_SECRET не задан или короче 32 символов")
    this.name = "PublicTokenConfigError"
  }
}

function getSecret(secret?: string) {
  const value = secret ?? process.env.PUBLIC_TOKEN_SECRET
  if (!value || value.length < 32) throw new PublicTokenConfigError()
  return value
}

export function hashPublicToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createPublicTokenNonce() {
  return randomBytes(24).toString("base64url")
}

export function derivePublicToken(
  idempotencyKey: string,
  nonce: string,
  secret?: string,
) {
  return createHmac("sha256", getSecret(secret))
    .update(`public-order-token-v1\0${idempotencyKey}\0${nonce}`)
    .digest("base64url")
}

export function createPublicTokenMaterial(
  idempotencyKey: string,
  now = new Date(),
  secret?: string,
) {
  const nonce = createPublicTokenNonce()
  const token = derivePublicToken(idempotencyKey, nonce, secret)
  return {
    token,
    nonce,
    hash: hashPublicToken(token),
    issuedAt: now,
    expiresAt: new Date(now.getTime() + PUBLIC_TOKEN_TTL_MS),
  }
}

type ExistingPublicToken = {
  publicTokenHash: string | null
  publicTokenNonce: string | null
  publicTokenExpiresAt: Date | null
  idempotencyKey: string | null
}

export function getExistingPublicTokenReplay(
  order: ExistingPublicToken,
  now = new Date(),
  secret?: string,
) {
  if (!order.publicTokenExpiresAt || order.publicTokenExpiresAt <= now || !order.publicTokenHash) {
    return null
  }

  if (order.publicTokenNonce && order.idempotencyKey) {
    const token = derivePublicToken(order.idempotencyKey, order.publicTokenNonce, secret)
    return hashPublicToken(token) === order.publicTokenHash ? token : null
  }

  return null
}
