export function Footer({ companyName = "Example Cleaning Company", phone = "" }: { companyName?: string, phone?: string }) {
  return (
    <footer className="border-t py-8 md:py-12 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {companyName}. Все права защищены.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          {phone && <span>{phone}</span>}
          <a href="/privacy" className="hover:text-foreground">Политика конфиденциальности</a>
        </div>
      </div>
    </footer>
  )
}
