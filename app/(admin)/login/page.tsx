"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme/ThemeToggle"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Неверный email или пароль")
      } else {
        router.push("/admin/orders")
        router.refresh()
      }
    } catch {
      setError("Ошибка при входе")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-card border rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <Sparkles className="w-10 h-10 text-primary mb-2" />
          <h1 className="text-2xl font-bold">Вход в админ-панель</h1>
          <p className="text-sm text-muted-foreground">Только для владельца</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Пароль</label>
            <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">{error}</div>}

          <Button type="submit" className="w-full h-12" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти"}
          </Button>
        </form>
      </div>
    </div>
  )
}
