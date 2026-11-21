"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/store/useCartStore"
import { Trash2, ArrowRight, ShieldAlert, Loader2 } from "lucide-react"

export default function CartPage() {
  const { items, removeItem, updateQuantity, hasHydrated } = useCartStore()
  const [tariff, setTariff] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    useCartStore.persist.rehydrate()
    fetch("/api/public/tariffs", { cache: "no-store" }).then((res) => res.ok ? res.json() : null).then(setTariff).catch(() => setTariff(null))
  }, [])

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const getBasePrice = (item: (typeof items)[number]) => {
    if (!tariff) return item.basePrice
    const fields: Record<string, Record<string, string>> = {
      SOFA: { sofa2: "priceSofa2", sofa3: "priceSofa3", corner: "priceSofaCorner" },
      ARMCHAIR: { armchair: "priceArmchair", recliner: "priceRecliner" },
      MATTRESS: { single: "priceMattressSingle", double: "priceMattressDouble" },
      CHAIR: { seat: "priceChairSeat", back: "priceChairBack" },
    }
    const field = fields[item.category]?.[item.variant]
    return field ? tariff[field] : item.basePrice
  }

  const getItemTotal = (item: (typeof items)[number]) => {
    if (item.needsPhotoQuote || item.category === "OTHER") return null
    let amount = getBasePrice(item) * item.quantity
    if (item.strongDirt) amount += amount * ((tariff?.strongDirtPercent ?? 30) / 100)
    if (item.secondSide && item.category === "MATTRESS") amount += amount * ((tariff?.mattressSecondSidePercent ?? 50) / 100)
    return Math.round(amount)
  }

  const total = items.reduce((sum, item) => sum + (getItemTotal(item) ?? 0), 0)
  const minOrder = tariff?.minOrder ?? 300000
  const hasKnownItems = items.some((item) => !item.needsPhotoQuote && item.category !== "OTHER")


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Ваша корзина</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-3xl">
            <h2 className="text-2xl font-semibold mb-4">Корзина пуста</h2>
            <p className="text-muted-foreground mb-8">Добавьте мебель, чтобы рассчитать стоимость чистки.</p>
            <Link href="/calculator">
              <Button size="lg" className="rounded-full">Перейти в калькулятор</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
            <div className="space-y-4">
              {items.map((item) => {
                const itemPrice = getItemTotal(item)
                const basePrice = getBasePrice(item)

                return (
                  <div key={item.id} className="bg-card border rounded-2xl p-5 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.strongDirt && (
                          <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-1 rounded-md">Сильные загрязнения</span>
                        )}
                        {item.secondSide && (
                          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md">Две стороны</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.needsPhotoQuote ? "Стоимость по фото" : `${(basePrice / 100).toLocaleString('ru-RU')} ₽ / шт`}</p>
                      {item.category === "OTHER" && item.description && (
                        <p className="mt-2 text-sm text-muted-foreground break-words">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</Button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-semibold text-lg">{itemPrice === null ? "По фото" : `${(itemPrice / 100).toLocaleString('ru-RU')} ₽`}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Удалить позицию «${item.title}»`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-card border rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Итого</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Сумма заказа</span>
                  <span>{(total / 100).toLocaleString('ru-RU')} ₽</span>
                </div>
                
                {hasKnownItems && total < minOrder && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex gap-2 items-start">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <p>Минимальная стоимость заказа — {(minOrder / 100).toLocaleString('ru-RU')} ₽.</p>
                  </div>
                )}

                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>К оплате</span>
                  <span>{hasKnownItems ? `${((Math.max(total, minOrder)) / 100).toLocaleString('ru-RU')} ₽` : "После оценки по фото"}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full rounded-full h-12 text-base">
                  Оформить заказ <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
