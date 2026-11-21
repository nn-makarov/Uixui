"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/store/useCartStore"
import { ArrowRight, Plus } from "lucide-react"

// Временные тарифы (в копейках)
const TARIFFS = {
  SOFA: [
    { variant: "sofa2", title: "Диван 2-местный", price: 250000 },
    { variant: "sofa3", title: "Диван 3-местный", price: 350000 },
    { variant: "corner", title: "Диван угловой", price: 450000 },
  ],
  ARMCHAIR: [
    { variant: "armchair", title: "Кресло обычное", price: 150000 },
    { variant: "recliner", title: "Кресло-реклайнер", price: 200000 },
  ],
  MATTRESS: [
    { variant: "single", title: "Матрас односпальный", price: 180000 },
    { variant: "double", title: "Матрас двуспальный", price: 250000 },
  ],
  CHAIR: [
    { variant: "seat", title: "Стул (сиденье)", price: 80000 },
    { variant: "back", title: "Стул (сиденье + спинка)", price: 120000 },
  ],
  OTHER: [{ variant: "other", title: "Другая мебель", price: 0 }],
}

export default function CalculatorPage() {
  const { addItem, items } = useCartStore()
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [strongDirtPercent, setStrongDirtPercent] = useState(30)
  const [secondSidePercent, setSecondSidePercent] = useState(50)

  useEffect(() => {
    fetch("/api/public/tariffs", { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("Не удалось загрузить цены"); return response.json() })
      .then((tariff) => {
        setLivePrices({
          sofa2: tariff.priceSofa2, sofa3: tariff.priceSofa3, corner: tariff.priceSofaCorner,
          armchair: tariff.priceArmchair, recliner: tariff.priceRecliner,
          single: tariff.priceMattressSingle, double: tariff.priceMattressDouble,
          seat: tariff.priceChairSeat, back: tariff.priceChairBack,
        })
        setStrongDirtPercent(tariff.strongDirtPercent)
        setSecondSidePercent(tariff.mattressSecondSidePercent)
      })
      .catch((error) => console.error(error))
  }, [])
  const [category, setCategory] = useState<keyof typeof TARIFFS>("SOFA")
  const [selectedVariant, setSelectedVariant] = useState<number>(0)
  const [quantity, setQuantity] = useState(1)
  const [strongDirt, setStrongDirt] = useState(false)
  const [secondSide, setSecondSide] = useState(false)
  const [description, setDescription] = useState("")
  const [formError, setFormError] = useState("")

  const currentItem = TARIFFS[category][selectedVariant]
  const currentPrice = category === "OTHER" ? 0 : (livePrices[currentItem.variant] ?? currentItem.price)

  const handleAdd = () => {
    if (category === "OTHER" && !description.trim()) { setFormError("Опишите мебель, которую нужно почистить"); return }
    setFormError("")
    addItem({
      category,
      variant: currentItem.variant,
      title: currentItem.title,
      quantity,
      strongDirt: category === "OTHER" ? false : strongDirt,
      secondSide: category === "MATTRESS" ? secondSide : false,
      needsPhotoQuote: category === "OTHER",
      description: category === "OTHER" ? description.trim() : undefined,
      basePrice: currentPrice,
    })
    // Сброс формы
    setQuantity(1)
    setStrongDirt(false)
    setSecondSide(false)
    setDescription("")
  }

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Калькулятор стоимости</h1>
        
        <div className="grid md:grid-cols-[1fr_350px] gap-8">
          {/* Левая часть - выбор */}
          <div className="space-y-8">
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">1. Выберите тип мебели</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(TARIFFS).map((cat) => (
                  <Button
                    key={cat}
                    variant={category === cat ? "default" : "outline"}
                    onClick={() => { setCategory(cat as keyof typeof TARIFFS); setSelectedVariant(0) }}
                    className="rounded-full"
                  >
                    {cat === "SOFA" && "Диваны"}
                    {cat === "ARMCHAIR" && "Кресла"}
                    {cat === "MATTRESS" && "Матрасы"}
                    {cat === "CHAIR" && "Стулья"}
                    {cat === "OTHER" && "Другое"}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3">
                {TARIFFS[category].map((item, idx) => (
                  <div
                    key={item.variant}
                    onClick={() => setSelectedVariant(idx)}
                    className={`p-4 border rounded-xl cursor-pointer flex justify-between items-center transition-colors ${selectedVariant === idx ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  >
                    <span className="font-medium">{item.title}</span>
                    <span className="text-muted-foreground">{category === "OTHER" ? "По фото" : `${((livePrices[item.variant] ?? item.price) / 100).toLocaleString('ru-RU')} ₽`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">2. Детали</h2>
              <div className="space-y-4">
                {category === "OTHER" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="other-description">Что нужно почистить?</label>
                    <textarea id="other-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} placeholder="Например: пуф, изголовье кровати, обивка стен..." className="w-full min-h-24 rounded-xl border bg-background p-3 text-sm" />
                    <p className="text-xs text-muted-foreground">Стоимость определим после просмотра фотографий.</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Количество</span>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>+</Button>
                  </div>
                </div>
                
                {category !== "OTHER" && <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-secondary/50">
                  <input type="checkbox" checked={strongDirt} onChange={(e) => setStrongDirt(e.target.checked)} className="w-5 h-5 accent-primary" />
                  <span>Сильные загрязнения (+{strongDirtPercent}%)</span>
                </label>}

                {category === "MATTRESS" && (
                  <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-secondary/50">
                    <input type="checkbox" checked={secondSide} onChange={(e) => setSecondSide(e.target.checked)} className="w-5 h-5 accent-primary" />
                    <span>Чистка с двух сторон (+{secondSidePercent}%)</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Правая часть - Итог */}
          <div>
            <div className="bg-card border rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Итого</h2>
              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{currentItem.title} × {quantity}</span>
                  <span>{category === "OTHER" ? "По фото" : `${((currentPrice * quantity) / 100).toLocaleString('ru-RU')} ₽`}</span>
                </div>
                {category !== "OTHER" && strongDirt && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Сильные загрязнения</span>
                    <span>+{((currentPrice * quantity * (strongDirtPercent / 100)) / 100).toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
                {secondSide && category === "MATTRESS" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Вторая сторона</span>
                    <span>+{((currentPrice * quantity * (secondSidePercent / 100)) / 100).toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
              </div>
              
              {formError && <p className="text-sm text-destructive mb-2">{formError}</p>}
              <Button className="w-full mb-3 rounded-full h-12" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" /> Добавить в корзину
              </Button>
              
              {cartCount > 0 && (
                <Link href="/cart" className="block">
                  <Button variant="outline" className="w-full rounded-full h-12">
                    Перейти в корзину ({cartCount}) <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}