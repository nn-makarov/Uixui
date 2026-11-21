import { NextResponse } from "next/server"
import type { RateLimitResult } from "@/lib/security/rate-limit"

export function tooManyRequests(result: RateLimitResult) {
  return NextResponse.json(
    { error: "Слишком много запросов. Попробуйте позже." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "Cache-Control": "private, no-store",
      },
    },
  )
}
