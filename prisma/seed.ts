import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { resolveBootstrapAdmin } from "../lib/bootstrap";

const prisma = new PrismaClient();

async function main() {
  const bootstrapAdmin = resolveBootstrapAdmin({
    email: process.env.BOOTSTRAP_ADMIN_EMAIL,
    password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  });

  await prisma.company.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      name: "Example Cleaning Company",
      phone: "+0 (000) 000-00-00",
      email: "operator@example.invalid",
      address: "Example City",
      serviceArea: "Example service area",
      workingHours: "Ежедневно 9:00–21:00",
      heroTitle: "Выездная химчистка мебели",
      heroSubtitle:
        "Вернём чистоту вашей мебели без выезда из дома",
      aboutText:
        "Профессиональная химчистка мягкой мебели с выездом на дом.",
      privacyVersion: "1.0",
    },
  });

  // Все суммы — в копейках
  await prisma.tariff.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      priceSofa2: 250000,
      priceSofa3: 350000,
      priceSofaCorner: 450000,
      priceArmchair: 150000,
      priceRecliner: 200000,
      priceMattressSingle: 180000,
      priceMattressDouble: 250000,
      priceChairSeat: 80000,
      priceChairBack: 120000,
      minOrder: 300000,
      strongDirtPercent: 30,
      mattressSecondSidePercent: 50,
      outOfTownFee: 100000,
    },
  });

  const existingOwner = await prisma.user.findUnique({
    where: { email: bootstrapAdmin.email },
    select: { id: true },
  });

  if (!existingOwner) {
    const passwordHash = await hash(bootstrapAdmin.password, 12);
    await prisma.user.create({
      data: {
        email: bootstrapAdmin.email,
        passwordHash,
        role: "OWNER",
      },
    });
  }

  console.log(
    existingOwner
      ? "Seed завершён: существующий OWNER сохранён без изменения пароля."
      : "Seed завершён: Company, Tariff и защищённый bootstrap OWNER созданы.",
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Не удалось выполнить seed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
