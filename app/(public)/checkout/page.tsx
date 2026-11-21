"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCartStore } from "@/lib/store/useCartStore"
import { SAME_ORIGIN_REQUEST_HEADER, SAME_ORIGIN_REQUEST_VALUE } from "@/lib/security/origin"
import {
  clearCheckoutDraft,
  createCheckoutFingerprint,
  createCheckoutIdempotencyKey,
  emptyCheckoutFormData,
  loadCheckoutDraft,
  saveCheckoutDraft,
} from "@/lib/checkout-draft"
import { ArrowLeft, Loader2, UploadCloud, X } from "lucide-react"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart, hasHydrated, setHasHydrated } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftReady, setDraftReady] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState("")
  const idempotencyKeyRef = useRef("")
  const fingerprintRef = useRef("")
  const initializedRef = useRef(false)
  const completedRef = useRef(false)

  // Инициализация хранилища
  useEffect(() => {
    useCartStore.persist.rehydrate()
  }, [setHasHydrated])

  const [formData, setFormData] = useState(emptyCheckoutFormData)

  const [photos, setPhotos] = useState<File[]>([])

  useEffect(() => {
    if (!hasHydrated || initializedRef.current) return

    const draft = loadCheckoutDraft(window.localStorage)
    const initialFormData = draft?.formData ?? emptyCheckoutFormData()
    const currentFingerprint = createCheckoutFingerprint(initialFormData, items)
    const nextKey = draft && draft.fingerprint === currentFingerprint
      ? draft.idempotencyKey
      : createCheckoutIdempotencyKey()

    setFormData(initialFormData)
    idempotencyKeyRef.current = nextKey
    fingerprintRef.current = currentFingerprint
    setIdempotencyKey(nextKey)
    initializedRef.current = true
    setDraftReady(true)
  }, [hasHydrated, items])

  useEffect(() => {
    if (!hasHydrated || !draftReady || completedRef.current) return

    const fingerprint = createCheckoutFingerprint(formData, items)
    let nextKey = idempotencyKeyRef.current
    if (!nextKey || (fingerprintRef.current && fingerprintRef.current !== fingerprint)) {
      nextKey = createCheckoutIdempotencyKey()
    }

    idempotencyKeyRef.current = nextKey
    fingerprintRef.current = fingerprint
    if (nextKey !== idempotencyKey) setIdempotencyKey(nextKey)

    saveCheckoutDraft(window.localStorage, {
      version: 1,
      idempotencyKey: nextKey,
      fingerprint,
      formData,
      savedAt: Date.now(),
    })
  }, [draftReady, formData, hasHydrated, idempotencyKey, items])

  if (!hasHydrated || !draftReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Ваша корзина пуста</h1>
          <Link href="/calculator"><Button>Вернуться в калькулятор</Button></Link>
        </main>
        <Footer />
      </div>
    )
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const allowed = newFiles.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024)
      if (allowed.length !== newFiles.length) setError("Подходят только JPEG, PNG или WebP до 5 МБ каждый")
      setPhotos((prev) => [...prev, ...allowed].slice(0, 3))
      e.target.value = ""
    }
  }

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    let succeeded = false

    try {
      const fingerprint = createCheckoutFingerprint(formData, items)
      const submissionKey = fingerprintRef.current === fingerprint && idempotencyKeyRef.current
        ? idempotencyKeyRef.current
        : createCheckoutIdempotencyKey()

      idempotencyKeyRef.current = submissionKey
      fingerprintRef.current = fingerprint
      setIdempotencyKey(submissionKey)
      saveCheckoutDraft(window.localStorage, {
        version: 1,
        idempotencyKey: submissionKey,
        fingerprint,
        formData,
        savedAt: Date.now(),
      })

      // Отправляем только то, что нужно серверу (без basePrice и title)
      const payloadItems = items.map(i => ({
        category: i.category,
        variant: i.variant,
        quantity: i.quantity,
        strongDirt: i.strongDirt,
        secondSide: i.secondSide,
        needsPhotoQuote: i.needsPhotoQuote,
        description: i.description,
      }))

      let uploadIds: string[] = []
      if (photos.length) {
        const uploadForm = new FormData()
        photos.forEach((photo) => uploadForm.append("files", photo))
        const uploadResponse = await fetch("/api/uploads", {
          method: "POST",
          headers: { [SAME_ORIGIN_REQUEST_HEADER]: SAME_ORIGIN_REQUEST_VALUE },
          body: uploadForm,
        })
        const uploadData = await uploadResponse.json()
        if (!uploadResponse.ok) throw new Error(uploadData.error || "Не удалось загрузить фотографии")
        uploadIds = uploadData.uploads.map((upload: { id: string }) => upload.id)
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Idempotency-Key": submissionKey,
          [SAME_ORIGIN_REQUEST_HEADER]: SAME_ORIGIN_REQUEST_VALUE
        },
        body: JSON.stringify({
          ...formData,
          items: payloadItems,
          uploadIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Проверяем, вернул ли сервер массив ошибок от Zod
        if (Array.isArray(data.error)) {
          const msg = data.error.map((issue: { message: string }) => issue.message).join(", ")
          throw new Error(msg)
        }
        throw new Error(data.error || "Ошибка при создании заявки")
      }

      succeeded = true
      completedRef.current = true
      clearCheckoutDraft(window.localStorage)
      idempotencyKeyRef.current = ""
      fingerprintRef.current = ""
      setIdempotencyKey("")
      clearCart()
      router.push(`/order/${data.token}`)
    } catch (err: unknown) {
      setError(
        err instanceof TypeError
          ? "Нет соединения с сервером. Проверьте интернет и повторите отправку."
          : err instanceof Error
            ? err.message
            : "Что-то пошло не так",
      )
    } finally {
      if (!succeeded) setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 container mx-auto px-4 max-w-4xl">
        <Link href="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Вернуться в корзину
        </Link>
        
        <h1 className="text-3xl font-bold mb-8">Оформление заявки</h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
          <div className="space-y-6">
            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold">Контактные данные</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ваше имя *</label>
                  <Input required value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="Иван" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Телефон *</label>
                  <Input required type="tel" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} placeholder="+0 (000) 000-00-00" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Адрес *</label>
                <Input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Город, улица, дом, квартира" />
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold">Дата и время</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Желаемая дата</label>
                  <Input type="date" value={formData.desiredDate} onChange={e => setFormData({...formData, desiredDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Желаемое время</label>
                  <Input type="time" value={formData.desiredTime} onChange={e => setFormData({...formData, desiredTime: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Комментарий (необязательно)</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.comment} 
                  onChange={e => setFormData({...formData, comment: e.target.value})} 
                  placeholder="Например: есть собака, или нужно поднять на 5 этаж"
                />
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold">Фотографии (до 3-х, до 5 МБ каждая)</h2>
              <p className="text-sm text-muted-foreground">Помогут мастеру оценить степень загрязнения.</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border bg-secondary/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(photo)} alt="Предпросмотр фотографии" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      aria-label="Удалить фотографию"
                      className="absolute top-1 right-1 bg-background/80 p-1 rounded-full hover:bg-destructive hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {photos.length < 3 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors text-muted-foreground">
                    <UploadCloud className="w-8 h-8 mb-2" />
                    <span className="text-xs text-center px-2">Загрузить фото</span>
                    <input type="file" accept="image/jpeg, image/png, image/webp" multiple className="hidden" onChange={handlePhotoUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.outOfTown} onChange={e => setFormData({...formData, outOfTown: e.target.checked})} className="w-5 h-5 accent-primary" />
                <span>Выезд за город</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input required type="checkbox" checked={formData.consentPd} onChange={e => setFormData({...formData, consentPd: e.target.checked})} className="w-5 h-5 mt-0.5 accent-primary" />
                <span className="text-sm">Я согласен на обработку персональных данных и принимаю условия <a href="/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">политики конфиденциальности</a></span>
              </label>
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Ваш заказ</h2>
            <div className="space-y-3 mb-6 text-sm">
              {items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground">{item.title} × {item.quantity}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 mb-4 text-sm bg-destructive/10 text-destructive rounded-lg font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full rounded-full h-12" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Отправка...</>
              ) : (
                "Отправить заявку"
              )}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  )
}
