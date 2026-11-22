"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/store/useCartStore"
import { ArrowRight, Plus, Sofa, Armchair, BedDouble, Chair, Ellipsis, RotateCcw, Check, Minus } from "lucide-react"

// Тарифы — резервные значения; актуальный прайс загружается из настроек компании.
const TARIFFS = {
  SOFA: [
    { variant: "sofa2", title: "2 места", price: 250000 },
    { variant: "sofa3", title: "3 места", price: 350000 },
    { variant: "corner", title: "Угловой", price: 450000 },
  ],
  ARMCHAIR: [
    { variant: "armchair", title: "Обычное", price: 150000 },
    { variant: "recliner", title: "Реклайнер", price: 200000 },
  ],
  MATTRESS: [
    { variant: "single", title: "Односпальный", price: 180000 },
    { variant: "double", title: "Двуспальный", price: 250000 },
  ],
  CHAIR: [
    { variant: "seat", title: "Сиденье", price: 80000 },
    { variant: "back", title: "Сиденье + спинка", price: 120000 },
  ],
  OTHER: [{ variant: "other", title: "Другая мебель", price: 0 }],
}

const categories = [
  { key: "SOFA", label: "Диван", Icon: Sofa },
  { key: "ARMCHAIR", label: "Кресло", Icon: Armchair },
  { key: "MATTRESS", label: "Матрас", Icon: BedDouble },
  { key: "CHAIR", label: "Стул", Icon: Chair },
  { key: "OTHER", label: "Другое", Icon: Ellipsis },
] as const

function FurnitureSketch({ variant }: { variant: string }) {
  const mattress = variant === "single" || variant === "double"
  const chair = ["armchair", "recliner", "seat", "back"].includes(variant)
  const corner = variant === "corner"
  const other = variant === "other"
  return (
    <svg viewBox="0 0 120 76" aria-hidden="true" className="calc-visual-furniture">
      <ellipse cx="60" cy="67" rx="43" ry="5" fill="currentColor" opacity=".12" />
      {mattress ? <g stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <rect x={variant === "single" ? 23 : 13} y="21" width={variant === "single" ? 74 : 94} height="32" rx="7" fill="#f8f4ed"/>
        <path d="M18 34 H102 M18 43 H102" stroke="#b8c8d8" strokeWidth="1.5" strokeDasharray="3 3"/>
        <path d="M23 53 V59 M97 53 V59" strokeWidth="3" strokeLinecap="round"/>
        <rect x="28" y="15" width="24" height="12" rx="5" fill="#fff"/><rect x="68" y="15" width="24" height="12" rx="5" fill="#fff"/>
      </g> : chair ? <g stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M34 18 Q34 12 41 12 H76 Q84 12 84 20 V43 H34Z" fill="#d9c7b2"/>
        <rect x="27" y="38" width="66" height="20" rx="8" fill="#c5ad95"/>
        <path d="M29 43 H91 M36 58 L32 65 M84 58 L88 65" fill="none" strokeLinecap="round"/>
        <path d={variant==="recliner"?"M82 44 L99 34 L103 42 L91 52":"M29 24 L20 24 V48 H29 M91 24 H100 V48 H91"} fill="#d9c7b2"/>
      </g> : other ? <g stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <rect x="31" y="16" width="58" height="42" rx="12" fill="#d9c7b2"/><path d="M44 29 H76 M44 38 H69" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        <path d="M60 5 V12 M60 62 V69 M21 37 H28 M92 37 H99" stroke="var(--primary)" strokeLinecap="round"/>
      </g> : <g stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
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
  sofa2: "Компактный диван на 2 места", sofa3: "Просторный диван на 3 места",
  corner: "Модель с угловой секцией", armchair: "Мягкое кресло с подлокотниками",
  recliner: "Кресло с раскладывающейся спинкой", single: "Матрас для одной спальной зоны",
  double: "Широкий матрас для двоих", seat: "Мягкая часть сиденья",
  back: "Сиденье и мягкая спинка", other: "Пуф, изголовье и другие изделия",
}

export default function CalculatorPage() {
  const { addItem, items } = useCartStore()
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})
  const [strongDirtPercent, setStrongDirtPercent] = useState(30)
  const [secondSidePercent, setSecondSidePercent] = useState(50)
  const [category, setCategory] = useState<keyof typeof TARIFFS>("SOFA")
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [strongDirt, setStrongDirt] = useState(false)
  const [secondSide, setSecondSide] = useState(false)
  const [description, setDescription] = useState("")
  const [formError, setFormError] = useState("")

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

  const currentItem = TARIFFS[category][selectedVariant]
  const currentPrice = category === "OTHER" ? 0 : (livePrices[currentItem.variant] ?? currentItem.price)
  const subtotal = currentPrice * quantity
  const strongAmount = category !== "OTHER" && strongDirt ? subtotal * strongDirtPercent / 100 : 0
  const secondAmount = category === "MATTRESS" && secondSide ? subtotal * secondSidePercent / 100 : 0
  const total = subtotal + strongAmount + secondAmount
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleAdd = () => {
    if (category === "OTHER" && !description.trim()) { setFormError("Опишите мебель, которую нужно почистить"); return }
    setFormError("")
    addItem({
      category, variant: currentItem.variant, title: currentItem.title, quantity,
      strongDirt: category === "OTHER" ? false : strongDirt,
      secondSide: category === "MATTRESS" ? secondSide : false,
      needsPhotoQuote: category === "OTHER",
      description: category === "OTHER" ? description.trim() : undefined,
      basePrice: currentPrice,
    })
    setQuantity(1); setStrongDirt(false); setSecondSide(false); setDescription("")
  }

  const changeCategory = (next: keyof typeof TARIFFS) => {
    setCategory(next); setSelectedVariant(0); setStrongDirt(false); setSecondSide(false); setFormError("")
  }
  const categoryLabel = categories.find((item) => item.key === category)?.label ?? "Мебель"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="calc-visual-page container mx-auto w-full max-w-6xl flex-1 px-4 py-7 md:py-12">
        <div className="mb-6 md:mb-9">
          <p className="text-sm font-medium text-primary">Быстрый расчёт</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Выберите мебель — рассчитаем чистку</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">Сначала предмет, затем несколько уточнений.</p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <section className="min-w-0 space-y-5">
            <div className="calc-visual-card rounded-3xl border bg-card p-3 sm:p-5">
              <div className="flex items-start justify-between gap-3 px-2 pt-1">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Выбрана мебель</p>
                  <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{categoryLabel}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Цена за предмет</p>
                  <p className="text-lg font-semibold text-primary">{category === "OTHER" ? "По фото" : `${(currentPrice / 100).toLocaleString("ru-RU")} ₽`}</p>
                </div>
              </div>

              <div className="calc-visual-stage relative mt-3 flex items-center justify-center overflow-hidden rounded-2xl bg-secondary/50">
                <div className="calc-visual-stage-orbit" aria-hidden="true" />
                <FurnitureSketch variant={currentItem.variant} />
                <button type="button" className="calc-visual-reset" aria-label="Сбросить ракурс" title="Сбросить ракурс"><RotateCcw size={17} /></button>
                <p className="calc-visual-hint">Предмет мебели · иллюстрация</p>
              </div>

              <div className="calc-visual-tabs mt-3 grid grid-cols-5 gap-1 rounded-2xl bg-secondary/60 p-1.5" aria-label="Категории мебели">
                {categories.map(({ key, label, Icon }) => (
                  <button key={key} type="button" aria-pressed={category === key} onClick={() => changeCategory(key)}
                    className={`calc-visual-tab ${category === key ? "is-active" : ""}`}>
                    <Icon size={21} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <section className="calc-visual-options rounded-3xl border bg-card p-4 sm:p-5" aria-labelledby="visual-options-title">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Следующий шаг</p>
                  <h2 id="visual-options-title" className="mt-1 text-lg font-semibold">Уточним параметры</h2>
                </div>
                <span className="text-xs text-muted-foreground">{selectedVariant + 1} из {TARIFFS[category].length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {TARIFFS[category].map((item, index) => {
                  const price = category === "OTHER" ? 0 : (livePrices[item.variant] ?? item.price)
                  const active = selectedVariant === index
                  return <button key={item.variant} type="button" aria-pressed={active} onClick={() => setSelectedVariant(index)}
                    className={`calc-visual-variant ${active ? "is-active" : ""}`}>
                    <span className="calc-visual-variant-art"><FurnitureSketch variant={item.variant} /></span>
                    <span className="min-w-0 flex-1 text-left">
                      <strong className="block text-sm font-semibold">{item.title}</strong>
                      <small className="mt-1 block text-xs text-muted-foreground">{variantNotes[item.variant]}</small>
                      <span className="mt-2 block text-sm font-semibold text-primary">{category === "OTHER" ? "По фото" : `${(price / 100).toLocaleString("ru-RU")} ₽`}</span>
                    </span>
                    <span className="calc-visual-variant-check">{active ? <Check size={14} /> : null}</span>
                  </button>
                })}
              </div>

              <div className="mt-5 divide-y rounded-2xl border">
                {category === "OTHER" && <div className="p-3 sm:p-4">
                  <label htmlFor="other-description" className="text-sm font-medium">Что нужно почистить?</label>
                  <textarea id="other-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000}
                    placeholder="Например: пуф, изголовье кровати..." className="mt-2 min-h-24 w-full rounded-xl border bg-background p-3 text-sm" />
                  <p className="mt-1 text-xs text-muted-foreground">Стоимость определим после просмотра фотографий.</p>
                </div>}
                <div className="flex items-center justify-between gap-4 p-3 sm:p-4">
                  <div><p className="text-sm font-medium">Количество</p><p className="text-xs text-muted-foreground">Предметов мебели</p></div>
                  <div className="flex items-center gap-3 rounded-full border bg-background p-1">
                    <button type="button" aria-label="Уменьшить количество" className="calc-visual-qty" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15}/></button>
                    <span className="min-w-5 text-center text-sm font-semibold">{quantity}</span>
                    <button type="button" aria-label="Увеличить количество" className="calc-visual-qty" onClick={() => setQuantity(quantity + 1)}><Plus size={15}/></button>
                  </div>
                </div>
                {category !== "OTHER" && <label className="flex cursor-pointer items-center justify-between gap-3 p-3 sm:p-4">
                  <span><strong className="block text-sm font-medium">Сильные загрязнения</strong><small className="text-xs text-muted-foreground">Пятна и сложная грязь</small></span>
                  <span className="flex items-center gap-3"><small className="text-xs text-muted-foreground">+{strongDirtPercent}%</small><input type="checkbox" checked={strongDirt} onChange={(event) => setStrongDirt(event.target.checked)} className="h-4 w-4 accent-primary"/></span>
                </label>}
                {category === "MATTRESS" && <label className="flex cursor-pointer items-center justify-between gap-3 p-3 sm:p-4">
                  <span><strong className="block text-sm font-medium">Чистка с двух сторон</strong><small className="text-xs text-muted-foreground">Обе поверхности матраса</small></span>
                  <span className="flex items-center gap-3"><small className="text-xs text-muted-foreground">+{secondSidePercent}%</small><input type="checkbox" checked={secondSide} onChange={(event) => setSecondSide(event.target.checked)} className="h-4 w-4 accent-primary"/></span>
                </label>}
              </div>
            </section>
          </section>

          <aside className="calc-visual-summary lg:sticky lg:top-24">
            <div className="rounded-3xl border bg-card p-5 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ваш заказ</p>
              <h2 className="mt-1 text-xl font-semibold">Предварительный расчёт</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">{currentItem.title} × {quantity}</span><strong>{category === "OTHER" ? "По фото" : `${(subtotal / 100).toLocaleString("ru-RU")} ₽`}</strong></div>
                {strongAmount > 0 && <div className="flex justify-between gap-3"><span className="text-muted-foreground">Сильные загрязнения</span><strong>+{(strongAmount / 100).toLocaleString("ru-RU")} ₽</strong></div>}
                {secondAmount > 0 && <div className="flex justify-between gap-3"><span className="text-muted-foreground">Вторая сторона</span><strong>+{(secondAmount / 100).toLocaleString("ru-RU")} ₽</strong></div>}
              </div>
              <div className="mt-5 border-t pt-4">
                <p className="text-xs text-muted-foreground">{category === "OTHER" ? "Итог уточним по фото" : "Предварительно"}</p>
                <p className="mt-1 text-2xl font-bold">{category === "OTHER" ? "По фото" : `${(total / 100).toLocaleString("ru-RU")} ₽`}</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Точную стоимость и время выезда подтвердит мастер.</p>
              {formError && <p className="mt-3 text-sm text-destructive" role="alert">{formError}</p>}
              <Button className="mt-5 h-12 w-full rounded-full" onClick={handleAdd}><Plus className="mr-2 h-4 w-4"/>Добавить в заказ</Button>
              {cartCount > 0 && <Link href="/cart" className="mt-3 block"><Button variant="outline" className="h-12 w-full rounded-full">К заказу ({cartCount}) <ArrowRight className="ml-2 h-4 w-4"/></Button></Link>}
              <div className="mt-4 text-center text-xs text-muted-foreground">✓ Без оплаты сейчас · заявка ни к чему не обязывает</div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
