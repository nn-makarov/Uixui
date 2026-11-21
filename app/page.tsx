import Link from "next/link"
import {
  ArrowRight, Check, Clock3, Droplets, ShieldCheck, Sparkles,
  Sofa, Armchair, BedDouble, CircleCheck, Star, Leaf, HeartHandshake,
  BadgeCheck, WandSparkles, CalendarCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { prisma } from "@/lib/db"

// Reviewed image sources: each is a direct, visible photo matching the furniture/service.
const heroImage = "/images/hero-sofa-extraction.webp"
const sofaImage = "https://images.unsplash.com/photo-1743059199976-b709ec1e35f8?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=900"
const mattressImage = "https://images.unsplash.com/photo-1647376036543-f9f543601a1d?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=900"
const chairImage = "https://images.unsplash.com/photo-1765723640023-f39fbadba823?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=900"
const rugImage = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85"
const cleaningDetailImage = "https://images.pexels.com/photos/30238384/pexels-photo-30238384.jpeg?cs=srgb&dl=pexels-mohammadabbasi-30238384.jpg&fm=jpg"


const services = [
  { title: "Диваны", price: "от 2 500 ₽", detail: "Прямые, угловые и модульные", image: sofaImage, icon: Sofa, popular: true },
  { title: "Матрасы", price: "от 1 800 ₽", detail: "Глубокая чистка и свежесть сна", image: mattressImage, icon: BedDouble },
  { title: "Ковры", price: "от 1 200 ₽", detail: "Освежаем цвет и фактуру", image: rugImage, icon: CircleCheck },
  { title: "Кресла", price: "от 1 500 ₽", detail: "Мягкая мебель для отдыха", image: chairImage, icon: Armchair },
]

const assurances = [
  { icon: ShieldCheck, title: "Бережно к ткани", text: "Подбираем состав под материал и тип загрязнения." },
  { icon: Leaf, title: "Безопасные средства", text: "Работаем профессиональными составами для дома." },
  { icon: Clock3, title: "Выезд к вам", text: "Привозим оборудование — мебель остаётся дома." },
  { icon: Sofa, title: "Разные виды мебели", text: "Диваны, матрасы, кресла и ковры." },
]

const steps = [
  { n: "01", title: "Выберите мебель", text: "Добавьте предметы в калькулятор и оцените стоимость." },
  { n: "02", title: "Подтвердите заявку", text: "Согласуем детали и удобное для вас время." },
  { n: "03", title: "Отдыхайте", text: "Мастер приедет и аккуратно очистит вашу мебель." },
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
    <div className="landing-page min-h-screen overflow-hidden">
      <Header companyName={data.name} phone={data.phone} />
      <main>
        <section className="landing-hero relative">
          <div className="landing-hero-scene relative min-h-[680px] overflow-hidden md:min-h-[760px]" style={{ backgroundImage: `url("${heroImage}")` }}>
            <div className="landing-hero-overlay absolute inset-0" />
            <div className="container relative z-10 mx-auto flex min-h-[680px] items-center px-4 pb-32 pt-16 md:min-h-[760px] md:px-6 md:pb-36">
              <div className="max-w-[610px]">
                <div className="landing-eyebrow mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold tracking-wide">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary"><CircleCheck className="size-3.5" /></span>
                  Профессиональная химчистка
                </div>
                <h1 className="landing-title text-4xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-5xl md:text-[4.2rem]">{data.heroTitle}</h1>
                <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground md:text-lg md:leading-8">{data.heroSubtitle}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="landing-primary-btn h-13 rounded-full px-7 text-base"><Link href="/calculator">Рассчитать стоимость <ArrowRight className="ml-1 size-4" /></Link></Button>
                  <Button asChild size="lg" variant="outline" className="landing-hero-secondary h-13 rounded-full px-7 text-base"><Link href="#services">Узнать больше <ArrowRight className="ml-1 size-4" /></Link></Button>
                </div>
              </div>
            </div>
            <div className="landing-hero-trust absolute inset-x-4 bottom-5 z-10 mx-auto grid max-w-6xl grid-cols-2 gap-3 rounded-2xl border px-4 py-4 sm:inset-x-6 sm:grid-cols-4 sm:gap-5 sm:px-7 md:bottom-8">
              {assurances.slice(0,4).map(({icon:Icon,title})=>(
                <div key={title} className="flex items-center gap-2.5 text-xs font-medium sm:gap-3 sm:text-sm">
                  <span className="landing-hero-trust-icon flex size-8 shrink-0 items-center justify-center rounded-full sm:size-9"><Icon className="size-4 sm:size-[18px]"/></span>
                  <span>{title}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="landing-section scroll-mt-24 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-9 flex flex-col justify-between gap-5 md:mb-12 md:flex-row md:items-end">
              <div>
                <p className="landing-kicker mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">Наши услуги</p>
                <h2 className="landing-section-title text-3xl font-semibold tracking-[-.045em] sm:text-4xl md:text-5xl">Чистота для каждой вещи</h2>
                <p className="mt-4 max-w-xl text-muted-foreground">Освежаем обивку, возвращаем комфорт и продлеваем жизнь вашей мебели.</p>
              </div>
              <Link href="/calculator" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all hover:gap-3">Все услуги и цены <ArrowRight className="size-4" /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(({ title, price, detail, image, icon: Icon, popular }) => (
                <Link key={title} href="/calculator" className="landing-service-card group relative overflow-hidden rounded-[1.6rem] border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <div className="landing-service-image relative h-48 overflow-hidden sm:h-52">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${image}")` }} role="img" aria-label={title} />
                    <div className="landing-service-image-overlay absolute inset-0" />
                    {popular && <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">Выбирают чаще</span>}
                    <span className="landing-service-icon absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full border backdrop-blur"><Icon className="size-4" /></span>
                  </div>
                  <div className="p-5 sm:p-5.5">
                    <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold tracking-tight">{title}</h3><span className="landing-service-arrow mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-1"><ArrowRight className="size-3.5" /></span></div>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{detail}</p>
                    <p className="mt-4 text-base font-semibold text-primary">{price}</p>
                  </div>
                </Link>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">Стоимость ориентировочная и зависит от размера изделия и состояния обивки.</p>
          </div>
        </section>

        <section className="landing-benefits-section py-6 md:py-10">
          <div className="container mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
            <div className="self-center">
              <p className="landing-kicker mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">Почему выбирают нас</p>
              <h2 className="landing-section-title text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Заботимся о мебели. И о вашем комфорте.</h2>
              <p className="mt-4 max-w-lg leading-7 text-muted-foreground">Профессиональное оборудование, внимательный мастер и бережный подход — чтобы дома снова было приятно отдыхать.</p>
              <Link href="/calculator" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">Узнать стоимость <ArrowRight className="size-4" /></Link>
            </div>
            <div className="landing-benefit-grid grid gap-3 sm:grid-cols-2">
              {[
                { icon: WandSparkles, title: "Глубокая очистка", text: "Убираем повседневные загрязнения и освежаем ткань." },
                { icon: HeartHandshake, title: "Бережная забота", text: "Учитываем тип обивки и рекомендации производителя." },
                { icon: ShieldCheck, title: "Понятный процесс", text: "Объясняем этапы работы и согласуем результат." },
                { icon: Droplets, title: "Свежесть дома", text: "Помогаем вернуть любимым вещам аккуратный вид." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="landing-benefit-card rounded-2xl border p-5 sm:p-6">
                  <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                  <h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="landing-section scroll-mt-24 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="landing-process relative overflow-hidden rounded-[2rem] border px-6 py-10 sm:px-10 md:px-14 md:py-14">
              <div className="relative z-10 mb-10 max-w-2xl md:mb-14">
                <p className="landing-kicker mb-3 text-xs font-bold uppercase tracking-[.2em] text-primary">Без лишних хлопот</p>
                <h2 className="landing-section-title text-3xl font-semibold tracking-[-.045em] sm:text-4xl md:text-5xl">От заявки до чистоты — три шага</h2>
                <p className="mt-4 max-w-lg leading-7 text-muted-foreground">Всё просто: вы выбираете мебель, мы организуем профессиональный уход.</p>
              </div>
              <div className="relative z-10 grid gap-7 md:grid-cols-3 md:gap-10">
                {steps.map((step, index) => <div key={step.n} className="landing-step border-t pt-5">
                  <div className="landing-step-mini mb-5 flex h-[94px] items-center gap-2 rounded-2xl px-3">
                    {index === 0 ? <><span className="landing-mini-object"><Sofa className="size-7"/></span><span className="landing-mini-object"><BedDouble className="size-7"/></span><span className="landing-mini-object"><Armchair className="size-7"/></span></> : index === 1 ? <span className="landing-mini-feature"><CalendarCheck className="size-9"/></span> : <span className="landing-mini-feature"><Droplets className="size-9"/></span>}
                  </div>
                  <span className="text-xs font-bold tracking-[.18em] text-primary">{step.n}</span><h3 className="mt-3 text-xl font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </div>)}
              </div>
              <div className="relative z-10 mt-10"><Button asChild size="lg" className="landing-primary-btn h-12 rounded-full px-6"><Link href="/calculator">Перейти к расчёту <ArrowRight className="ml-1 size-4" /></Link></Button></div>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="container mx-auto px-4 md:px-6">
            <div className="landing-final-cta relative flex flex-col items-start justify-between gap-7 overflow-hidden rounded-[2rem] border p-7 sm:p-10 md:flex-row md:items-center md:p-12">
              <div className="relative z-10 max-w-2xl">
                <div className="mb-3 flex items-center gap-1 text-primary">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="size-4 fill-current" />)}</div>
                <h2 className="landing-section-title text-2xl font-semibold tracking-[-.04em] sm:text-3xl md:text-4xl">Подарите любимой мебели новую свежесть</h2>
                <p className="mt-3 max-w-xl text-muted-foreground">Рассчитайте стоимость и выберите удобное время для визита мастера.</p>
              </div>
              <Button asChild size="lg" className="landing-primary-btn relative z-10 h-12 shrink-0 rounded-full px-6"><Link href="/calculator">Рассчитать стоимость <ArrowRight className="ml-1 size-4" /></Link></Button>
            </div>
          </div>
        </section>
      </main>
      <Footer phone={data.phone} companyName={data.name} />
    </div>
  )
}
