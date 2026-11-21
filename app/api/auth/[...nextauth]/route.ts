import { handlers } from "@/lib/auth"
import { enforceRequestRateLimit } from "@/lib/security/request-rate-limit"
import { extractLoginEmail } from "@/lib/security/login-identity"
import type { NextRequest } from "next/server"

export const GET = handlers.GET

export async function POST(req: NextRequest) {
  const pathname = new URL(req.url).pathname
  if (pathname.endsWith("/api/auth/callback/credentials")) {
    const limited = await enforceRequestRateLimit(req, "login")
    if (limited) return limited
    const normalizedEmail = await extractLoginEmail(req)
    if (normalizedEmail) {
      const emailLimited = await enforceRequestRateLimit(req, "loginEmail", normalizedEmail)
      if (emailLimited) return emailLimited
    }
  }
  return handlers.POST(req)
}

export const runtime = "nodejs" // Явно указываем, что тут нужен Node.js, а не Edge
