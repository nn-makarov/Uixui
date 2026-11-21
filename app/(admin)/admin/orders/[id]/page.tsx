"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Copy, Link2, Loader2, RefreshCw, Save, ServerCrash, ShieldAlert, WifiOff } from "lucide-react"
import { getOrderItemCategoryLabel, getOrderItemTitle } from "@/lib/order-display"
import { SAME_ORIGIN_REQUEST_HEADER, SAME_ORIGIN_REQUEST_VALUE } from "@/lib/security/origin"
import {
  formatBusinessDateTime,
  getEditableBusinessDateTime,
  resolveBusinessDateTimeForSave,
} from "@/lib/date-time"

type AdminOrderItem = {
  id: string
  category: string
  variant: string
  quantity: number
  strongDirt: boolean
  secondSide: boolean
  needsPhotoQuote: boolean
  lineTotal: number | null
  description: string | null
}

type AdminOrder = {
  id: string
  customerName: string
  customerPhone: string
  address: string
  desiredDate: string | null
  desiredTime: string | null
  comment: string | null
  outOfTown: boolean
  createdAt: string
  status: string
  finalPrice: number | null
  agreedDateTime: string | null
  adminNotes: string | null
  estimatedCleaning: number
  estimatedOutOfTown: number
  estimatedTotal: number
  items: AdminOrderItem[]
  photos: { id: string }[]
}

type AdminLoadError = {
  kind: "unauthorized" | "not-found" | "server" | "network"
}

const QUICK_TIMES = ["09:00", "12:00", "15:00", "18:00"]

function formatPrice(kopecks: number) {
  return `${(kopecks / 100).toLocaleString("ru-RU")} ₽`
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<AdminOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<AdminLoadError | null>(null)
  const [saveError, setSaveError] = useState("")
  const [reissueError, setReissueError] = useState("")
  const [reissuing, setReissuing] = useState(false)
  const [publicLink, setPublicLink] = useState("")
  const [publicLinkExpiresAt, setPublicLinkExpiresAt] = useState("")
  const [copied, setCopied] = useState(false)

  // Состояния для формы
  const [status, setStatus] = useState("NEW")
  const [finalPrice, setFinalPrice] = useState<string>("")
  const [agreedDate, setAgreedDate] = useState("")
  const [agreedTime, setAgreedTime] = useState("")
  const [originalAgreedDateTime, setOriginalAgreedDateTime] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState("")

  const fetchOrder = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setLoadError(null)

    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, { cache: "no-store", signal })
      if (res.status === 401) {
        setOrder(null)
        setLoadError({ kind: "unauthorized" })
        return
      }
      if (res.status === 404) {
        setOrder(null)
        setLoadError({ kind: "not-found" })
        return
      }
      if (!res.ok) {
        setOrder(null)
        setLoadError({ kind: "server" })
        return
      }

      const data = await res.json() as AdminOrder
      if (signal?.aborted) return
      setOrder(data)
      setStatus(data.status)
      setFinalPrice(data.finalPrice !== null ? (data.finalPrice / 100).toString() : "")
      const editableAgreedDateTime = getEditableBusinessDateTime(data.agreedDateTime)
      setAgreedDate(editableAgreedDateTime.date)
      setAgreedTime(editableAgreedDateTime.time)
      setOriginalAgreedDateTime(data.agreedDateTime)
      setAdminNotes(data.adminNotes || "")
    } catch (loadFailure) {
      if (loadFailure instanceof DOMException && loadFailure.name === "AbortError") return
      setOrder(null)
      setLoadError({ kind: "network" })
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    const controller = new AbortController()
    fetchOrder(controller.signal)
    return () => controller.abort()
  }, [fetchOrder])

  const handleSave = async () => {
    setSaving(true)
    setSaveError("")

    try {
      const priceInKopecks = finalPrice ? Math.round(parseFloat(finalPrice) * 100) : null
      const agreedDateTime = resolveBusinessDateTimeForSave(
        originalAgreedDateTime,
        agreedDate,
        agreedTime,
      )

      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          [SAME_ORIGIN_REQUEST_HEADER]: SAME_ORIGIN_REQUEST_VALUE,
        },
        body: JSON.stringify({
          status,
          finalPrice: priceInKopecks,
          agreedDateTime,
          adminNotes,
        })
      })

      if (res.ok) {
        router.refresh()
        await fetchOrder()
        alert("Заявка обновлена!")
      } else {
        const data = await res.json().catch(() => null)
        if (res.status === 401) {
          setSaveError("Сессия истекла. Войдите в систему снова.")
        } else if (res.status === 404) {
          setSaveError("Заявка не найдена.")
        } else if (res.status >= 500) {
          setSaveError("Временная ошибка сервера. Попробуйте сохранить ещё раз.")
        } else {
          setSaveError(Array.isArray(data?.error) ? data.error[0]?.message : data?.error || "Не удалось сохранить изменения")
        }
      }
    } catch (saveError) {
      if (saveError instanceof TypeError) {
        setSaveError("Нет соединения с сервером. Проверьте интернет и попробуйте снова.")
      } else {
        setSaveError(saveError instanceof Error ? saveError.message : "Не удалось сохранить изменения")
      }
    } finally {
      setSaving(false)
    }
  }

  const applyClientWishes = () => {
    if (!order) return

    const willReplaceAgreedTime = Boolean(originalAgreedDateTime) && Boolean(agreedDate || agreedTime)
    if (
      willReplaceAgreedTime
      && !window.confirm("Заказ уже содержит согласованное время. Заменить поля пожеланиями клиента?")
    ) {
      return
    }

    if (order.desiredDate) {
      const desired = getEditableBusinessDateTime(order.desiredDate)
      if (desired.date) setAgreedDate(desired.date)
    }
    if (order.desiredTime) setAgreedTime(order.desiredTime)
  }

  const reissuePublicLink = async () => {
    setReissuing(true)
    setReissueError("")
    setCopied(false)

    try {
      const response = await fetch(`/api/admin/orders/${params.id}/public-link/reissue`, {
        method: "POST",
        headers: { [SAME_ORIGIN_REQUEST_HEADER]: SAME_ORIGIN_REQUEST_VALUE },
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || "Не удалось перевыпустить публичную ссылку")
      }
      setPublicLink(`${window.location.origin}/order/${data.token}`)
      setPublicLinkExpiresAt(data.expiresAt)
    } catch (error) {
      setReissueError(error instanceof Error ? error.message : "Не удалось перевыпустить публичную ссылку")
    } finally {
      setReissuing(false)
    }
  }

  const copyPublicLink = async () => {
    if (!publicLink) return
    try {
      await navigator.clipboard.writeText(publicLink)
      setCopied(true)
    } catch {
      setReissueError("Не удалось скопировать ссылку. Выделите её вручную.")
    }
  }

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center gap-2" aria-live="polite">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Загружаем заявку…</p>
      </div>
    )
  }

  if (!order) {
    const errorView = loadError?.kind === "unauthorized"
      ? {
          icon: ShieldAlert,
          title: "Требуется авторизация",
          description: "Сессия истекла или у вас нет доступа к этой заявке.",
          retry: false,
          login: true,
        }
      : loadError?.kind === "not-found"
        ? {
            icon: ShieldAlert,
            title: "Заявка не найдена",
            description: "Проверьте ссылку или вернитесь к списку заявок.",
            retry: false,
            login: false,
          }
        : loadError?.kind === "network"
          ? {
              icon: WifiOff,
              title: "Нет соединения",
              description: "Не удалось связаться с сервером. Проверьте интернет и повторите загрузку.",
              retry: true,
              login: false,
            }
          : {
              icon: ServerCrash,
              title: "Временная ошибка",
              description: "Не удалось загрузить заявку. Попробуйте ещё раз.",
              retry: true,
              login: false,
            }
    const ErrorIcon = errorView.icon

    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <ErrorIcon className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">{errorView.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{errorView.description}</p>
        <div className="flex justify-center flex-wrap gap-3">
          {errorView.retry && (
            <Button type="button" onClick={() => fetchOrder()}>
              <RefreshCw className="w-4 h-4" />
              Повторить
            </Button>
          )}
          {errorView.login ? (
            <Button asChild variant="outline"><Link href="/login">Войти</Link></Button>
          ) : (
            <Button asChild variant="outline"><Link href="/admin/orders">К списку заявок</Link></Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Заявка от {order.customerName}</h1>
          <p className="text-sm text-muted-foreground">Создана: {formatBusinessDateTime(order.createdAt)} (Москва)</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Данные клиента</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Имя</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Пожелания клиента</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Желаемая дата</p>
                <p className="font-medium">
                  {order.desiredDate
                    ? formatBusinessDateTime(order.desiredDate, { dateStyle: "long" })
                    : "Не указано"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Желаемое время</p>
                <p className="font-medium">{order.desiredTime || "Не указано"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Адрес</p>
                <p className="font-medium break-words">{order.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Выезд за город</p>
                <p className="font-medium">{order.outOfTown ? "Да" : "Нет"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Комментарий клиента</p>
                <p className="font-medium whitespace-pre-wrap break-words">{order.comment || "Не указан"}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Состав заказа</h2>
            <div className="space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 py-4 border-b last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {getOrderItemCategoryLabel(item.category)}
                    </p>
                    <p className="font-medium break-words">
                      {getOrderItemTitle(item.category, item.variant)} × {item.quantity}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.strongDirt && (
                        <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          Сильные загрязнения
                        </span>
                      )}
                      {item.secondSide && (
                        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          Вторая сторона матраса
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-2 break-words">{item.description}</p>
                    )}
                  </div>
                  <p className="font-medium shrink-0">
                    {item.needsPhotoQuote
                      ? "Стоимость уточняется по фото"
                      : formatPrice(item.lineTotal ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-semibold">Предварительный расчёт</h2>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Стоимость чистки</span>
              <span className="font-medium text-right">{formatPrice(order.estimatedCleaning)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Стоимость выезда за город</span>
              <span className="font-medium text-right">{formatPrice(order.estimatedOutOfTown)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-3">
              <span className="font-semibold">Предварительная общая стоимость</span>
              <span className="font-bold text-lg text-right">{formatPrice(order.estimatedTotal)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-3">
              <span className="text-muted-foreground">Согласованная итоговая цена</span>
              <span className="font-semibold text-right">
                {order.finalPrice !== null ? formatPrice(order.finalPrice) : "Ещё не установлена"}
              </span>
            </div>
          </div>
          {order.photos?.length > 0 && (
            <div className="bg-card border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Фотографии клиента</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {order.photos.map((photo: { id: string }) => (
                  <a key={photo.id} href={`/api/admin/photos/${photo.id}?orderId=${order.id}`} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/admin/photos/${photo.id}?orderId=${order.id}`} alt="Фото мебели от клиента" className="aspect-square w-full rounded-lg border object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Управление</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Статус</label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="NEW">Новая</option>
                <option value="AGREED">Согласована</option>
                <option value="COMPLETED">Завершена</option>
                <option value="CANCELLED">Отменена</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Согласованная итоговая цена (₽)</label>
              <Input 
                type="number" 
                placeholder="Например: 5000" 
                value={finalPrice}
                onChange={e => setFinalPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Согласованные дата и время (Москва)</label>
              <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
                <Input
                  type="date"
                  aria-label="Согласованная дата"
                  value={agreedDate}
                  onChange={e => setAgreedDate(e.target.value)}
                />
                <Input
                  type="time"
                  aria-label="Согласованное время"
                  step="900"
                  value={agreedTime}
                  onChange={e => setAgreedTime(e.target.value)}
                />
              </div>
              {(order.desiredDate || order.desiredTime) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyClientWishes}
                >
                  Использовать пожелания клиента
                </Button>
              )}
              <div className="flex flex-wrap gap-2">
                {QUICK_TIMES.map(time => (
                  <Button
                    key={time}
                    type="button"
                    size="sm"
                    variant={agreedTime === time ? "default" : "outline"}
                    onClick={() => setAgreedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Время вводится и отображается по Москве, в API сохраняется в UTC.
              </p>
            </div>

            {saveError && <div className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">{saveError}</div>}

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Сохранить изменения
            </Button>
            {status === "AGREED" && <p className="text-xs text-center text-muted-foreground">Для статуса &quot;Согласована&quot; обязательны цена и время.</p>}
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Публичная ссылка</h2>
              <p className="text-sm text-muted-foreground">
                Перевыпуск сразу отключит предыдущую ссылку. Новая ссылка показывается только один раз.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={reissuePublicLink}
              disabled={reissuing}
              className="w-full"
            >
              {reissuing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Link2 className="w-4 h-4" />}
              Перевыпустить публичную ссылку
            </Button>
            {reissueError && (
              <p className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">
                {reissueError}
              </p>
            )}
            {publicLink && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input value={publicLink} readOnly aria-label="Новая публичная ссылка" />
                  <Button type="button" size="icon" variant="outline" onClick={copyPublicLink}>
                    <Copy className="w-4 h-4" />
                    <span className="sr-only">Скопировать ссылку</span>
                  </Button>
                </div>
                {publicLinkExpiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Действует до {formatBusinessDateTime(publicLinkExpiresAt)} (Москва)
                  </p>
                )}
                {copied && <p className="text-xs text-green-600">Ссылка скопирована</p>}
                <p className="text-xs text-destructive">
                  Предыдущая ссылка больше не работает.
                </p>
              </div>
            )}
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-2">
            <label className="text-sm font-medium">Приватные заметки</label>
            <textarea 
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Заметки видны только вам..."
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
