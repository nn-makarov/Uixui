"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save } from "lucide-react"
import { SAME_ORIGIN_REQUEST_HEADER, SAME_ORIGIN_REQUEST_VALUE } from "@/lib/security/origin"

type CompanyForm = {
  name: string
  phone: string
  email: string
  address: string
  serviceArea: string
  workingHours: string
  heroTitle: string
  heroSubtitle: string
  aboutText: string
  privacyVersion: string
}

const emptyCompany: CompanyForm = {
  name: "", phone: "", email: "", address: "", serviceArea: "", workingHours: "",
  heroTitle: "", heroSubtitle: "", aboutText: "", privacyVersion: "1.0",
}

export default function AdminCompanyPage() {
  const [company, setCompany] = useState<CompanyForm>(emptyCompany)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/company", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Не удалось загрузить настройки")
        setCompany({ ...emptyCompany, ...data, email: data.email || "", address: data.address || "" })
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Ошибка загрузки"))
      .finally(() => setLoading(false))
  }, [])

  const update = (field: keyof CompanyForm, value: string) => setCompany((current) => ({ ...current, [field]: value }))

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const payload: CompanyForm = {
        name: company.name, phone: company.phone, email: company.email, address: company.address,
        serviceArea: company.serviceArea, workingHours: company.workingHours,
        heroTitle: company.heroTitle, heroSubtitle: company.heroSubtitle,
        aboutText: company.aboutText, privacyVersion: company.privacyVersion,
      }
      const response = await fetch("/api/admin/company", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          [SAME_ORIGIN_REQUEST_HEADER]: SAME_ORIGIN_REQUEST_VALUE,
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(Array.isArray(data.error) ? data.error[0]?.message : data.error || "Ошибка сохранения")
      setCompany({ ...emptyCompany, ...data, email: data.email || "", address: data.address || "" })
      setMessage("Настройки сохранены")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить настройки")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  if (error && !company.name) return <div className="p-8 text-destructive">{error}</div>

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки компании</h1>
        <p className="text-sm text-muted-foreground mt-1">Эти данные используются на главной странице и в контактах.</p>
      </div>
      <form onSubmit={save} className="space-y-6">
        <section className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Контакты и зона работы</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1 text-sm">Название<Input required value={company.name} onChange={(e) => update("name", e.target.value)} /></label>
            <label className="space-y-1 text-sm">Телефон<Input required value={company.phone} onChange={(e) => update("phone", e.target.value)} /></label>
            <label className="space-y-1 text-sm">Email<Input type="email" value={company.email} onChange={(e) => update("email", e.target.value)} /></label>
            <label className="space-y-1 text-sm">Адрес<Input value={company.address} onChange={(e) => update("address", e.target.value)} /></label>
            <label className="space-y-1 text-sm">Город / зона выезда (показывается в шапке)<Input required value={company.serviceArea} onChange={(e) => update("serviceArea", e.target.value)} /></label>
            <label className="space-y-1 text-sm">Часы работы<Input required value={company.workingHours} onChange={(e) => update("workingHours", e.target.value)} /></label>
          </div>
        </section>
        <section className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Текст главной страницы</h2>
          <label className="block space-y-1 text-sm">Заголовок<Input required value={company.heroTitle} onChange={(e) => update("heroTitle", e.target.value)} /></label>
          <label className="block space-y-1 text-sm">Подзаголовок<textarea required value={company.heroSubtitle} onChange={(e) => update("heroSubtitle", e.target.value)} className="w-full min-h-20 rounded-md border bg-background p-3" /></label>
          <label className="block space-y-1 text-sm">О компании<textarea value={company.aboutText} onChange={(e) => update("aboutText", e.target.value)} className="w-full min-h-28 rounded-md border bg-background p-3" /></label>
        </section>
        <section className="bg-card border rounded-xl p-6 space-y-2">
          <h2 className="font-semibold">Персональные данные</h2>
          <label className="block space-y-1 text-sm">Версия политики конфиденциальности<Input required value={company.privacyVersion} onChange={(e) => update("privacyVersion", e.target.value)} /></label>
          <p className="text-xs text-muted-foreground">При изменении текста политики обновите номер версии, чтобы он сохранялся в новых заявках.</p>
        </section>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Сохранить настройки</Button>
      </form>
    </div>
  )
}
