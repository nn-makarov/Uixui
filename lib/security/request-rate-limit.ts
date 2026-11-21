import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { resolveRequestClientIp } from "@/lib/security/client-ip"
import { consumeRateLimit, type RateLimitScope } from "@/lib/security/rate-limit"
import { tooManyRequests } from "@/lib/security/rate-limit-response"

export async function enforceRequestRateLimit(
  req: Request,
  scope: RateLimitScope,
  identity?: string,
) {
  try {
    const clientIp = resolveRequestClientIp(req)
    if (clientIp === "unknown") {
      return NextResponse.json(
        { error: "Не удалось безопасно определить источник запроса." },
        {
          status: 503,
          headers: {
            "Retry-After": "5",
            "Cache-Control": "private, no-store",
          },
        },
      )
    }
    const result = await consumeRateLimit(prisma, scope, identity ?? clientIp)
    return result.allowed ? null : tooManyRequests(result)
  } catch (error) {
    console.error("Rate limit backend error:", error)
    return NextResponse.json(
      { error: "Сервис временно недоступен. Попробуйте позже." },
      {
        status: 503,
        headers: {
          "Retry-After": "5",
          "Cache-Control": "private, no-store",
        },
      },
    )
  }
}
