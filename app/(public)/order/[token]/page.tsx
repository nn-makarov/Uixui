"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Loader2, RefreshCw, ServerCrash, WifiOff } from "lucide-react"
import { formatBusinessDateTime } from "@/lib/date-time"

type OrderItem = {
  id: string
  categoryLabel: string
  title: string
  description: string | null
  quantity: number
  strongDirt: boolean
  secondSide: boolean
  needsPhotoQuote: boolean
  lineTotal: number | null
}

type OrderStatus = "NEW" | "AGREED" | "COMPLETED" | "CANCELLED"

type OrderData = {
  status: OrderStatus
  customerName: string
  address: string
  estimatedTotal: number
  estimatedCleaning: number
  estimatedOutOfTown: number
  finalPrice: number | null
  agreedDateTime: string | null
  hasPhotoRequest: boolean
  items: OrderItem[]
}

type LoadError = {
  kind: "not-found" | "server" | "network"
}

const STATUS_MAP: Record<OrderStatus, {
  title: string
  description: string
  color: string
  icon: typeof Clock
}> = {
  NEW: {
    title: "Заявка получена",
    description: "Заявка ожидает подтверждения. Мы свяжемся с вами, чтобы согласовать стоимость и время.",
    color: "bg-blue-500/10 text-blue-500",
    icon: Clock,
  },
  AGREED: {
    title: "Заказ согласован",
    description: "Стоимость и время согласованы. Мастер приедет в указанное ниже время.",
    color: "bg-green-500/10 text-green-500",
    icon: CheckCircle2,
  },
  COMPLETED: {
    title: "Работа завершена",
    description: "Заказ выполнен. Спасибо, что воспользовались нашей услугой.",
    color: "bg-green-500/10 text-green-500",
    icon: CheckCircle2,
  },
  CANCELLED: {
    title: "Заказ отменён",
    description: "Заказ отменён. Если это произошло по ошибке, свяжитесь с нами.",
    color: "bg-red-500/10 text-red-500",
    icon: AlertCircle,
  },
}

function formatPrice(kopecks: number) {
  return `${(kopecks / 100).toLocaleString("ru-RU")} ₽`
}

export default function OrderPage() {
  const params = useParams()
  const token = params.token as string
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<LoadError | null>(null)

  const loadOrder = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/orders/${token}`, { cache: "no-store", signal })

      if (res.status === 404) {
        setOrder(null)
        setError({ kind: "not-found" })
        return
      }

      if (!res.ok) {
        setOrder(null)
        setError({ kind: "server" })
        return
      }

      const data = await res.json() as OrderData
      if (!signal?.aborted) setOrder(data)
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return
      setOrder(null)
      setError({ kind: "network" })
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    loadOrder(controller.signal)
    return () => controller.abort()
  }, [loadOrder])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-4" aria-live="polite">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Загружаем заказ…</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    const errorView = error?.kind === "not-found"
      ? {
          icon: AlertCircle,
          title: "Заказ не найден",
          description: "Ссылка недействительна или заказ с таким адресом не существует.",
          retry: false,
        }
      : error?.kind === "network"
        ? {
            icon: WifiOff,
            title: "Нет соединения",
            description: "Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.",
            retry: true,
          }
        : {
            icon: ServerCrash,
            title: "Временная ошибка",
            description: "Сервис временно недоступен. Попробуйте повторить загрузку через несколько секунд.",
            retry: true,
          }
    const ErrorIcon = errorView.icon

    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <ErrorIcon className="w-10 h-10 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{errorView.title}</h1>
          <p className="text-muted-foreground max-w-md mb-8">{errorView.description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {errorView.retry && (
              <Button type="button" onClick={() => loadOrder()}>
                <RefreshCw className="w-4 h-4" />
                Повторить
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const currentStatus = STATUS_MAP[order.status] ?? STATUS_MAP.NEW
  const StatusIcon = currentStatus.icon

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 container mx-auto px-4 max-w-3xl">
        <div className="mb-8 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${currentStatus.color}`}>
            <StatusIcon className="w-4 h-4" />
            {currentStatus.title}
          </div>
          <h1 className="text-3xl font-bold mb-2">Заказ для {order.customerName}</h1>
          <p className="text-muted-foreground">{currentStatus.description}</p>
        </div>

        <div className="bg-card border rounded-2xl p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-semibold mb-4 text-lg">Детали заказа</h2>
            <div className="space-y-3">
              {order.items.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 py-4 border-b last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.categoryLabel}</p>
                    <p className="font-medium break-words">{item.title} × {item.quantity}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.strongDirt && (
                        <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          Сильные загрязнения
                        </span>
                      )}
                      {item.secondSide && (
                        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          Две стороны
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-2 text-sm text-muted-foreground break-words">{item.description}</p>
                    )}
                  </div>
                  <div className="sm:text-right shrink-0">
                    {item.needsPhotoQuote
                      ? <span className="text-sm font-medium text-muted-foreground">Стоимость уточняется по фото</span>
                      : <span className="font-semibold">{formatPrice(item.lineTotal ?? 0)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground">Стоимость чистки</span>
              <span className="font-medium text-right">
                {order.estimatedCleaning > 0
                  ? formatPrice(order.estimatedCleaning)
                  : order.hasPhotoRequest
                    ? "Уточняется по фото"
                    : formatPrice(0)}
              </span>
            </div>
            {order.estimatedOutOfTown > 0 && (
              <div className="flex justify-between items-center gap-4">
                <span className="text-muted-foreground">Доплата за выезд за город</span>
                <span className="font-medium text-right">{formatPrice(order.estimatedOutOfTown)}</span>
              </div>
            )}
            <div className="flex justify-between items-center gap-4 border-t pt-3">
              <span className="font-semibold">Предварительная общая стоимость</span>
              <span className="font-bold text-lg text-right">
                {order.estimatedTotal > 0
                  ? formatPrice(order.estimatedTotal)
                  : order.hasPhotoRequest
                    ? "Уточняется по фото"
                    : formatPrice(0)}
              </span>
            </div>
            {order.hasPhotoRequest && (
              <p className="text-sm text-muted-foreground">
                В предварительную стоимость входит рассчитанная часть заказа. Позиции, отмеченные «Уточняется по фото», рассчитаем после просмотра фотографий.
              </p>
            )}
          </div>

          {order.finalPrice !== null && (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
              <div>
                <p className="font-semibold">Согласованная итоговая стоимость</p>
                <p className="text-sm text-muted-foreground">Эта сумма подтверждена администратором.</p>
              </div>
              <span className="font-bold text-xl">{formatPrice(order.finalPrice)}</span>
            </div>
          )}
          {order.finalPrice === null && (
            <div className="rounded-xl border border-dashed p-4">
              <p className="font-medium">Итоговая стоимость ещё не согласована</p>
              <p className="text-sm text-muted-foreground">Мы свяжемся с вами и подтвердим окончательную сумму отдельно.</p>
            </div>
          )}
          {order.agreedDateTime && (
            <div className="border-t pt-4">
              <h2 className="font-semibold mb-1">Согласованное время</h2>
              <time dateTime={order.agreedDateTime} className="text-muted-foreground">
                {formatBusinessDateTime(order.agreedDateTime)} (Москва)
              </time>
            </div>
          )}
          <div>
            <h2 className="font-semibold mb-2 text-lg">Адрес</h2>
            <p className="text-muted-foreground">{order.address}</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> На главную
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
