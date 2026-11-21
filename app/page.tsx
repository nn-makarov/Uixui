import Link from "next/link"
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Clock3,
  Droplets,
  ShieldCheck,
  Sparkles,
  Sofa,
  Armchair,
  BedDouble,
  CircleCheck,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { prisma } from "@/lib/db"

const services = [
  { title: "Диваны", price: "от 2 500 ₽", description: "Прямые и угловые, любые ткани", icon: Sofa, tag: "Самое популярное" },
  { title: "Кресла", price: "от 1 500 ₽", description: "Любимые места для отдыха", icon: Armchair },
  { title: "Матрасы", price: "от 1 800 ₽", description: "Свежесть и чистота для сна", icon: BedDouble },
  { title: "Стулья", price: "от 800 ₽", description: "Сиденья и мягкие спинки", icon: CircleCheck },
]

const benefits = [
  { icon: ShieldCheck, title: "Бережно к ткани", text: "Подбираем метод и состав под материал вашей мебели." },
  { icon: Droplets, title: "Глубокая очистка", text: "Удаляем бытовые загрязнения и освежаем обивку." },
  { icon: Clock3, title: "Удобно дома", text: "Приезжаем к вам — не нужно никуда везти мебель." },
]

const steps = [
  { number: "01", title: "Рассчитайте", text: "Выберите мебель в калькуляторе и узнайте ориентировочную стоимость." },
  { number: "02", title: "Согласуйте", text: "Оставьте заявку — уточним детали и удобное время." },
  { number: "03", title: "Наслаждайтесь", text: "Мастер приедет с оборудованием и вернёт мебели свежий вид." },
]

export default async function Home() {
  const company = await prisma.company.findUnique({ where: { id: "singleton" } })
  const data = company || {
    heroTitle: "Чистота, которую видно. Свежесть, которую чувствуешь.",
    heroSubtitle: "Профессиональная химчистка мягкой мебели у вас дома. Заботимся о любимых вещах — бережно и с вниманием к деталям.",
    phone: "",
    name: "Uixui",
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <Header companyName={data.name} phone={data.phone} />
      <main>
        <section className="relative isolate">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-40 -top-36 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute left-[-12rem] top-72 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="container mx-auto grid items-center gap-12 px-4 pb-20 pt-14 md:px-6 md:pb-28 md:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="size-4" />
                Профессиональная чистка мебели
              </div>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl md:text-6xl">
                {data.heroTitle}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
                {data.heroSubtitle}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-13 rounded-full px-7 text-base shadow-lg shadow-primary/20">
                  <Link href="/calculator">
                    Рассчитать стоимость <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-13 rounded-full border-border/80 bg-background/70 px-7 text-base">
                  <Link href="#services">Наши услуги</Link>
                </Button>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Check className="size-4 text-primary" /> Выезд на дом</span>
                <span className="inline-flex items-center gap-2"><Check className="size-4 text-primary" /> Понятная стоимость</span>
                <span className="inline-flex items-center gap-2"><Check className="size-4 text-primary" /> Бережный подход</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[590px] lg:ml-auto">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-primary/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card p-2.5 shadow-2xl shadow-black/10">
                <div
                  role="img"
                  aria-label="Светлая уютная гостиная с чистым мягким диваном"
                  className="relative min-h-[340px] overflow-hidden rounded-[1.5rem] bg-cover bg-center sm:min-h-[460px]"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555048452-4b7b1c6c8a2d?auto=format&fit=crop&w=1400&q=85')" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-7 sm:left-7 sm:right-7">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/75">Ваш дом · ваша свежесть</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Мебель снова как новая</p>
                    </div>
                    <div className="hidden size-12 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/15 backdrop-blur sm:flex">
                      <ArrowDownRight className="size-5" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-card/95 px-4 py-3 shadow-xl backdrop-blur md:-left-8 md:px-5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-5" /></div>
                <div>
                  <p className="text-sm font-semibold">Внимание к каждой детали</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Профессиональный уход</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-secondary/30">
          <div className="container mx-auto grid gap-6 px-4 py-8 sm:grid-cols-3 md:px-6 md:py-10">
            {benefits.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-background text-primary"><Icon className="size-5" /></div>
                <div><h2 className="font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="scroll-mt-24 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-11 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Что мы чистим</p>
                <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Уход за вашей мебелью</h2>
                <p className="mt-4 max-w-xl text-muted-foreground">Освежаем обивку и возвращаем любимым вещам опрятный вид.</p>
              </div>
              <Link href="/calculator" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">Все услуги в калькуляторе <ArrowRight className="size-4" /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(({ title, price, description, icon: Icon, tag }) => (
                <Link key={title} href="/calculator" className="group relative rounded-3xl border border-border/70 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/5">
                  {tag && <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">{tag}</span>}
                  <div className="mb-9 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-6" /></div>
                  <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{description}</p>
                  <p className="mt-5 text-lg font-semibold text-primary">{price}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground">Узнать подробнее <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Стоимость ориентировочная. Итоговая цена зависит от размера мебели и состояния обивки.</p>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground sm:px-10 md:px-14 md:py-16">
              <div className="mb-12 max-w-2xl">
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.16em] text-primary-foreground/70">Всего три шага</p>
                <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Чистая мебель — без лишних хлопот</h2>
                <p className="mt-4 max-w-lg leading-7 text-primary-foreground/75">Простой процесс от расчёта до результата. Всё организуем вместе с вами.</p>
              </div>
              <div className="grid gap-8 md:grid-cols-3 md:gap-10">
                {steps.map((step) => (
                  <div key={step.number} className="border-t border-primary-foreground/20 pt-5">
                    <span className="text-sm font-semibold tracking-widest text-primary-foreground/65">{step.number}</span>
                    <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-primary-foreground/75">{step.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-12">
                <Button asChild size="lg" variant="secondary" className="h-12 rounded-full px-6">
                  <Link href="/calculator">Начать расчёт <ArrowRight className="ml-1 size-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-border/70 bg-secondary/30 p-7 sm:flex-row sm:items-center sm:p-10">
              <div>
                <div className="mb-3 flex items-center gap-1 text-primary"><Star className="size-4 fill-current" /><Star className="size-4 fill-current" /><Star className="size-4 fill-current" /><Star className="size-4 fill-current" /><Star className="size-4 fill-current" /></div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Подарите мебели вторую жизнь</h2>
                <p className="mt-3 max-w-xl text-muted-foreground">Узнайте стоимость чистки и выберите удобное время для визита мастера.</p>
              </div>
              <Button asChild size="lg" className="h-12 shrink-0 rounded-full px-6">
                <Link href="/calculator">Рассчитать стоимость <ArrowRight className="ml-1 size-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer phone={data.phone} companyName={data.name} />
    </div>
  )
}
