import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { CheckCircle2, ShieldCheck, Clock, ThumbsUp } from "lucide-react"
import { prisma } from "@/lib/db"

export default async function Home() {
  // Получаем настройки компании из базы данных
  const company = await prisma.company.findUnique({ where: { id: "singleton" } })
  
  // Если по какой-то причине базы нет, используем заглушки
  const data = company || {
    heroTitle: "Вернём чистоту вашей мебели без выезда из дома",
    heroSubtitle: "Глубокая химчистка диванов, кресел, матрасов и ковров. Безопасные средства, сохнет за 4-6 часов.",
    phone: "+0 (000) 000-00-00",
    name: "Example Cleaning Company"
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Передаем название и телефон в шапку */}
      <Header companyName={data.name} phone={data.phone} />
      
      <main className="flex-1">
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-36 md:pb-48">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-secondary mb-6">
                  <SparklesIcon className="mr-2 h-4 w-4" /> Профессиональное оборудование
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  {data.heroTitle}
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  {data.heroSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/calculator">
                    <Button size="lg" className="w-full sm:w-auto rounded-full text-base h-14 px-8">
                      Рассчитать стоимость
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full text-base h-14 px-8">
                      Как это работает
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative lg:ml-auto w-full max-w-lg mx-auto lg:max-w-none">
                <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-secondary shadow-2xl">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <span className="text-muted-foreground font-medium">Фото идеально чистого дивана</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-secondary/20 border-y">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-background rounded-2xl shadow-sm border"><ShieldCheck className="w-6 h-6 text-primary" /></div>
                <h3 className="font-semibold text-lg">Безопасно</h3>
                <p className="text-sm text-muted-foreground">Гипоаллергенные средства для детей и животных</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-background rounded-2xl shadow-sm border"><Clock className="w-6 h-6 text-primary" /></div>
                <h3 className="font-semibold text-lg">Быстро</h3>
                <p className="text-sm text-muted-foreground">Средняя продолжительность чистки 1.5 - 2 часа</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-background rounded-2xl shadow-sm border"><CheckCircle2 className="w-6 h-6 text-primary" /></div>
                <h3 className="font-semibold text-lg">Профессионально</h3>
                <p className="text-sm text-muted-foreground">Опытные мастера и проф. оборудование</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-background rounded-2xl shadow-sm border"><ThumbsUp className="w-6 h-6 text-primary" /></div>
                <h3 className="font-semibold text-lg">Гарантия</h3>
                <p className="text-sm text-muted-foreground">Устраняем недостатки бесплатно в день сдачи</p>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Услуги и цены</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Точная стоимость зависит от степени загрязнения и размера мебели. Окончательная цена согласовывается после осмотра.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Диваны", price: "от 2 500 ₽", desc: "Прямые и угловые, любые ткани" },
                { title: "Кресла", price: "от 1 500 ₽", desc: "Включая кресла-кровати" },
                { title: "Матрасы", price: "от 1 800 ₽", desc: "Очистка с двух сторон" },
                { title: "Стулья", price: "от 800 ₽", desc: "Сиденья и спинки" }
              ].map((item) => (
                <div key={item.title} className="bg-card rounded-2xl border p-6 flex flex-col hover:border-primary transition-colors cursor-default">
                  <div className="h-32 bg-secondary/50 rounded-xl mb-4 flex items-center justify-center">Фото</div>
                  <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                  <p className="text-primary font-medium mb-2">{item.price}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 md:py-28 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Как это работает</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center relative">
                <div className="w-12 h-12 rounded-full bg-primary-foreground text-primary flex items-center justify-center text-xl font-bold mx-auto mb-6">1</div>
                <h3 className="text-xl font-semibold mb-3">Выбираете мебель</h3>
                <p className="text-primary-foreground/80">Добавляете нужные предметы в калькулятор и получаете предварительную стоимость</p>
              </div>
              <div className="text-center relative">
                <div className="w-12 h-12 rounded-full bg-primary-foreground text-primary flex items-center justify-center text-xl font-bold mx-auto mb-6">2</div>
                <h3 className="text-xl font-semibold mb-3">Оформляете заявку</h3>
                <p className="text-primary-foreground/80">Оставляете контакты и фото загрязнений. Мы связываемся и согласовываем время</p>
              </div>
              <div className="text-center relative">
                <div className="w-12 h-12 rounded-full bg-primary-foreground text-primary flex items-center justify-center text-xl font-bold mx-auto mb-6">3</div>
                <h3 className="text-xl font-semibold mb-3">Встречаете мастера</h3>
                <p className="text-primary-foreground/80">Мастер приезжает в назначенное время со всем оборудованием и наводит чистоту</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer phone={data.phone} companyName={data.name} />
    </div>
  )
}

function SparklesIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
