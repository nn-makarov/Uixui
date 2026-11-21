import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { Sparkles } from "lucide-react"

export function Header({ companyName = "Example Cleaning Company", phone = "" }: { companyName?: string, phone?: string }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">{companyName}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/#services" className="text-muted-foreground hover:text-foreground transition-colors">Услуги и цены</Link>
          <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">Как это работает</Link>
        </nav>
        <div className="flex items-center gap-4">
          {phone && <a href={`tel:${phone}`} className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground">{phone}</a>}
          <ThemeToggle />
          <Link href="/calculator">
            <Button className="rounded-full">Рассчитать стоимость</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
