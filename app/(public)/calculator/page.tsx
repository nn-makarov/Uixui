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

function FurnitureSketch({ variant }: { variant: string }) {
  const mattress = variant === "single" || variant === "double"
  const chair = ["armchair", "recliner", "seat", "back"].includes(variant)
  const corner = variant === "corner"
  const other = variant === "other"
  return (
    <svg viewBox="0 0 120 76" aria-hidden="true" className="calc-furniture-sketch">
      <ellipse cx="60" cy="66" rx="43" ry="5" fill="currentColor" opacity=".08" />
      {mattress ? <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <rect x={variant === "single" ? 23 : 13} y="21" width={variant === "single" ? 74 : 94} height="32" rx="6" fill="#f8f4ed"/>
        <path d="M18 34 H102 M18 43 H102" stroke="#b8c8d8" strokeWidth="1.5" strokeDasharray="3 3"/>
        <path d="M23 53 V59 M97 53 V59" strokeWidth="3" strokeLinecap="round"/>
        <rect x="28" y="15" width="24" height="12" rx="5" fill="#fff"/><rect x="68" y="15" width="24" height="12" rx="5" fill="#fff"/>
      </g> : chair ? <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M34 18 Q34 12 41 12 H76 Q84 12 84 20 V43 H34Z" fill="#d9c7b2"/>
        <rect x="27" y="38" width="66" height="20" rx="8" fill="#c5ad95"/>
        <path d="M29 43 H91 M36 58 L32 65 M84 58 L88 65" fill="none" strokeLinecap="round"/>
        <path d={variant==="recliner"?"M82 44 L99 34 L103 42 L91 52":"M29 24 L20 24 V48 H29 M91 24 H100 V48 H91"} fill="#d9c7b2"/>
      </g> : other ? <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <rect x="31" y="16" width="58" height="42" rx="12" fill="#d9c7b2"/><path d="M44 29 H76 M44 38 H69" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        <path d="M60 5 V12 M60 62 V69 M21 37 H28 M92 37 H99" stroke="#6aa8f5" strokeLinecap="round"/>
      </g> : <g stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <path d={corner?"M18 28 Q18 21 26 21 H65 Q72 21 72 28 V39 H103 V53 H18Z":"M19 28 Q19 21 27 21 H93 Q101 21 101 28 V43 H19Z"} fill="#d9c7b2"/>
        {corner ? <path d="M72 28 Q72 21 80 21 H94 Q103 21 103 29 V43 H72Z" fill="#c5ad95"/> : null}
        <path d={variant==="sofa3"?"M43 24 V42 M76 24 V42":"M60 24 V42"} stroke="#f5e9db" strokeWidth="2"/>
        <rect x="15" y="39" width={corner?92:90} height="18" rx="7" fill="#c5ad95"/>
        <path d="M24 57 L21 65 M94 57 L97 65" fill="none" strokeLinecap="round"/>
      </g>}
    </svg>
  )
}
const variantNotes: Record<string, string> = {
  sofa2: "Компактный диван на 2 посадочных места", sofa3: "Просторный диван на 3 посадочных места",
  corner: "Угловая модель с дополнительной секцией", armchair: "Мягкое кресло с подлокотниками",
  recliner: "Кресло с раскладывающейся спинкой", single: "Матрас для одной спальной зоны",
  double: "Широкий матрас для двоих", seat: "Чистим мягкую часть сиденья",
  back: "Сиденье и мягкая спинка стула", other: "Пуф, изголовье и другие изделия",
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

              <div className="calc-option-grid">
                {TARIFFS[category].map((item, idx) => (
                  <button key={item.variant} type="button" aria-pressed={selectedVariant === idx}
                    onClick={() => setSelectedVariant(idx)}
                    className={`calc-option-tile ${selectedVariant === idx ? "is-selected" : ""}`}>
                    <span className="calc-option-art"><FurnitureSketch variant={item.variant} /></span>
                    <span className="calc-option-copy">
                      <span className="calc-option-title">{item.title}</span>
                      <span className="calc-option-note">{variantNotes[item.variant]}</span>
                      <span className="calc-option-price">{category === "OTHER" ? "По фото" : `${((livePrices[item.variant] ?? item.price) / 100).toLocaleString('ru-RU')} ₽`}</span>
                    </span>
                    <span className="calc-option-check" aria-hidden="true">{selectedVariant === idx ? "✓" : "+"}</span>
                  </button>
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