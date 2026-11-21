"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save } from "lucide-react"
import { SAME_ORIGIN_REQUEST_HEADER, SAME_ORIGIN_REQUEST_VALUE } from "@/lib/security/origin"

type TariffForm = Record<string, string>

export default function AdminTariffsPage() {
  const [tariff, setTariff] = useState<TariffForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchTariffs = () => {
    fetch("/api/admin/tariffs")
      .then(res => res.json())
      .then(data => {
        // При получении из базы переводим копейки в рубли для полей ввода
        const formattedData = { ...data }
        const priceFields = [
          "priceSofa2", "priceSofa3", "priceSofaCorner", "priceArmchair", 
          "priceRecliner", "priceMattressSingle", "priceMattressDouble", 
          "priceChairSeat", "priceChairBack", "minOrder", "outOfTownFee"
        ]
        for (const field of priceFields) {
          formattedData[field] = data[field] ? (data[field] / 100).toString() : "0"
        }
        
        setTariff(formattedData)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchTariffs()
  }, [])

  const handleChange = (field: string, value: string) => {
    // Сохраняем строку, чтобы можно было стереть поле
    setTariff({ ...tariff, [field]: value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const payload: Record<string, string | number> = { ...tariff }
    delete payload.id
    delete payload.updatedAt
    const priceFields = [
      "priceSofa2", "priceSofa3", "priceSofaCorner", "priceArmchair", 
      "priceRecliner", "priceMattressSingle", "priceMattressDouble", 
      "priceChairSeat", "priceChairBack", "minOrder", "outOfTownFee"
    ]
    
    // Переводим рубли в копейки для базы
    for (const field of priceFields) {
      const val = parseFloat(String(payload[field]))
      payload[field] = isNaN(val) || val < 0 ? 0 : Math.round(val * 100)
    }

    const percentFields = ["strongDirtPercent", "mattressSecondSidePercent"]
    for (const field of percentFields) {
      const val = parseInt(String(payload[field]), 10)
      payload[field] = isNaN(val) || val < 0 ? 0 : val
    }

    const res = await fetch("/api/admin/tariffs", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        [SAME_ORIGIN_REQUEST_HEADER]: SAME_ORIGIN_REQUEST_VALUE,
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      alert("Тарифы успешно сохранены!")
      fetchTariffs() // Перезагружаем, чтобы всё пересчиталось
    } else {
      alert("Ошибка при сохранении")
    }
    setSaving(false)
  }

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (!tariff) return <div className="p-12 text-center text-muted-foreground">Тарифы не найдены</div>

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Тарифы и цены</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Базовые цены (в рублях)</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Диван 2-местный</label>
              <Input type="number" value={tariff.priceSofa2} onChange={e => handleChange("priceSofa2", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Диван 3-местный</label>
              <Input type="number" value={tariff.priceSofa3} onChange={e => handleChange("priceSofa3", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Диван угловой</label>
              <Input type="number" value={tariff.priceSofaCorner} onChange={e => handleChange("priceSofaCorner", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Кресло обычное</label>
              <Input type="number" value={tariff.priceArmchair} onChange={e => handleChange("priceArmchair", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Кресло-реклайнер</label>
              <Input type="number" value={tariff.priceRecliner} onChange={e => handleChange("priceRecliner", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Матрас 1-спальный</label>
              <Input type="number" value={tariff.priceMattressSingle} onChange={e => handleChange("priceMattressSingle", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Матрас 2-спальный</label>
              <Input type="number" value={tariff.priceMattressDouble} onChange={e => handleChange("priceMattressDouble", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Стул (сиденье)</label>
              <Input type="number" value={tariff.priceChairSeat} onChange={e => handleChange("priceChairSeat", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Стул (спинка)</label>
              <Input type="number" value={tariff.priceChairBack} onChange={e => handleChange("priceChairBack", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Дополнительные настройки</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Мин. стоимость (₽)</label>
              <Input type="number" value={tariff.minOrder} onChange={e => handleChange("minOrder", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Выезд за город (₽)</label>
              <Input type="number" value={tariff.outOfTownFee} onChange={e => handleChange("outOfTownFee", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Доплата за грязь (%)</label>
              <Input type="number" value={tariff.strongDirtPercent} onChange={e => handleChange("strongDirtPercent", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Две стороны матраса (%)</label>
              <Input type="number" value={tariff.mattressSecondSidePercent} onChange={e => handleChange("mattressSecondSidePercent", e.target.value)} />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Сохранить тарифы
        </Button>
      </form>
    </div>
  )
}
