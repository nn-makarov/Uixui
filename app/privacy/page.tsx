import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { prisma } from "@/lib/db"

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Cleaning App",
  description: "Обработка персональных данных при оформлении и выполнении заказов.",
}

export const dynamic = "force-dynamic"

export default async function PrivacyPage() {
  const company = await prisma.company.findUnique({ where: { id: "singleton" } })
  const companyName = company?.name || "Оператор сервиса"
  const phone = company?.phone || ""
  const email = company?.email || ""
  const address = company?.address || ""

  return (
    <div className="flex min-h-screen flex-col">
      <Header companyName={companyName} phone={phone} />
      <main className="flex-1 py-12">
        <article className="container mx-auto max-w-3xl px-4 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-3">Политика конфиденциальности</h1>
            <p className="text-sm text-muted-foreground">
              Версия политики: {company?.privacyVersion || "не указана"}
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Оператор</h2>
            <p>{companyName}</p>
            {address && <p className="text-muted-foreground">{address}</p>}
            {(phone || email) && (
              <p className="text-muted-foreground">
                Контакты: {[phone, email].filter(Boolean).join(", ")}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Какие данные обрабатываются</h2>
            <p>
              Имя, телефон, адрес, желаемые дата и время, комментарий, состав заказа,
              сведения о согласии, фотографии мебели, а также технические данные,
              необходимые для защиты сервиса.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Цели обработки</h2>
            <p>
              Оформление и выполнение заказа, связь с клиентом, расчёт стоимости,
              согласование времени, обработка фотографий, поддержка и защита заказов
              от несанкционированного доступа.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Хранение</h2>
            <p>
              Заказы и связанные фотографии хранятся в защищённых системах сервиса
              не дольше, чем необходимо для указанных целей и выполнения обязательных
              требований. Незавершённый черновик заявки может храниться в браузере
              пользователя до 7 дней и удаляется после успешного создания заказа.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Удаление и обращения</h2>
            <p>
              Для запроса доступа, исправления или удаления данных свяжитесь с
              оператором по указанным выше контактам и укажите имя, телефон и ссылку
              на заказ. Запрос обрабатывается оператором; данные удаляются или
              анонимизируются, кроме сведений, которые необходимо сохранить по
              применимым требованиям.
            </p>
            <p>
              Черновик в браузере можно удалить независимо, очистив данные сайта
              в настройках браузера.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Защита данных</h2>
            <p>
              Доступ к административным данным ограничен авторизованным владельцем.
              Публичные ссылки имеют ограниченный срок действия и могут быть
              перевыпущены. Загруженные фотографии перекодируются, а служебные
              метаданные удаляются.
            </p>
          </section>

          <Link href="/" className="inline-block text-primary hover:underline">
            Вернуться на главную
          </Link>
        </article>
      </main>
      <Footer companyName={companyName} phone={phone} />
    </div>
  )
}
