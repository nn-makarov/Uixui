import { auth, signOut } from "@/lib/auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, LogOut, LayoutDashboard, Settings, Building2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme/ThemeToggle"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-secondary/20">
      {/* Боковое меню */}
      <aside className="w-64 bg-card border-r flex flex-col fixed inset-y-0">
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-primary mr-2" />
            <span className="font-bold">Админ-панель</span>
          </div>
          <ThemeToggle />
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/orders" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-secondary text-foreground">
            <LayoutDashboard className="w-4 h-4" /> Заявки
          </Link>
          <Link href="/admin/tariffs" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-secondary text-muted-foreground">
            <Settings className="w-4 h-4" /> Тарифы
          </Link>
          <Link href="/admin/company" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg hover:bg-secondary text-muted-foreground">
            <Building2 className="w-4 h-4" /> Компания
          </Link>
        </nav>

        <div className="p-4 border-t">
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Выйти
            </Button>
          </form>
        </div>
      </aside>

      {/* Контент */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
