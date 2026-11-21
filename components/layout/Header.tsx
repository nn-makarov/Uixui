import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { Sparkles, MapPin } from "lucide-react"

export function Header({ companyName = "Example Cleaning Company", phone = "", city = "Москва" }: { companyName?: string, phone?: string, city?: string }) {
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
          {(city || phone) && <div className="hidden sm:flex items-center gap-3 text-sm font-medium text-muted-foreground">{city && <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><MapPin className="size-3.5 text-primary" />{city}</span>}{phone && <a href={`tel:${phone}`} className="whitespace-nowrap hover:text-foreground">{phone}</a>}</div>}
          <ThemeToggle />
          <Link href="/calculator">
            <Button className="rounded-full">Рассчитать стоимость</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
