import { NextResponse } from "next/server"
import { hasSameOrigin } from "@/lib/security/origin"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { PricingError } from "@/lib/pricing/calculate"
import { createPublicOrder, OrderCreateError } from "@/lib/orders/create"
import { enforceRequestRateLimit } from "@/lib/security/request-rate-limit"

const orderSchema = z.object({
  customerName: z.string().trim().min(2, "Имя слишком короткое").max(100),
  customerPhone: z.string().trim().min(10, "Телефон слишком короткий").max(30),
  address: z.string().trim().min(5, "Адрес слишком короткий").max(300),
  desiredDate: z.string().optional().nullable().transform((value) => value || null),
  desiredTime: z.string().optional().nullable().transform((value) => value || null),
  comment: z.string().trim().max(2000).optional().nullable(),
  outOfTown: z.boolean(),
  consentPd: z.literal(true, { error: "Необходимо согласие на обработку персональных данных" }),
  uploadIds: z.array(z.string().min(1)).max(3).default([]),
  items: z.array(z.object({
    category: z.string().min(1),
    variant: z.string().min(1),
    quantity: z.number().int().min(1).max(50),
    strongDirt: z.boolean(),
    secondSide: z.boolean(),
    needsPhotoQuote: z.boolean().optional(),
    description: z.string().max(1000).optional(),
  })).min(1).max(100),
}).superRefine((data, ctx) => {
  if (data.desiredTime && !data.desiredDate) {
    ctx.addIssue({ code: "custom", path: ["desiredDate"], message: "Укажите дату, если выбираете время" })
  }
  if (data.desiredDate) {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.desiredDate)
    const parsed = new Date(`${data.desiredDate}T00:00:00Z`)
    if (!dateMatch || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== data.desiredDate) {
      ctx.addIssue({ code: "custom", path: ["desiredDate"], message: "Некорректная дата" })
    }
  }
  if (data.desiredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.desiredTime)) {
    ctx.addIssue({ code: "custom", path: ["desiredTime"], message: "Некорректное время" })
  }
  data.items.forEach((item, index) => {
    if (item.category === "OTHER" && !item.description?.trim()) {
      ctx.addIssue({ code: "custom", path: ["items", index, "description"], message: "Опишите мебель для оценки по фото" })
    }
  })
  if (data.items.some((item) => item.category === "OTHER") && data.uploadIds.length === 0) {
    ctx.addIssue({ code: "custom", path: ["uploadIds"], message: "Для оценки другой мебели приложите фотографию" })
  }
})

export async function POST(req: Request) {
  if (!hasSameOrigin(req)) return NextResponse.json({ error: "Недопустимый источник запроса" }, { status: 403 })
  const limited = await enforceRequestRateLimit(req, "orderCreate")
  if (limited) return limited
  const idempotencyKey = req.headers.get("Idempotency-Key")
  if (!idempotencyKey || idempotencyKey.length > 128) {
    return NextResponse.json({ error: "Отсутствует или некорректен ключ отправки" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const data = orderSchema.parse(body)
    const uploadSessionId = req.headers.get("cookie")?.match(/(?:^|;\s*)upload-session=([a-zA-Z0-9-]{20,80})/)?.[1]
    const result = await createPublicOrder(
      prisma,
      (callback) => prisma.$transaction(callback),
      idempotencyKey,
      data,
      uploadSessionId,
    )
    if (!result.token) {
      return NextResponse.json({
        error: "Заявка уже создана, но публичная ссылка недоступна. Запросите её перевыпуск у администратора.",
        alreadyCreated: true,
        reissueRequired: true,
      }, { status: 409 })
    }
    return NextResponse.json({ token: result.token }, { status: result.status })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 })
    if (error instanceof OrderCreateError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof PricingError) return NextResponse.json({ error: error.message }, { status: 400 })
    console.error("Ошибка создания заявки:", error)
    return NextResponse.json({ error: "Не удалось создать заявку. Попробуйте ещё раз." }, { status: 500 })
  }
}
