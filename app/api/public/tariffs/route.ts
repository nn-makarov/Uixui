import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const tariff = await prisma.tariff.findUnique({ where: { id: "singleton" } })
    if (!tariff) return NextResponse.json({ error: "Тарифы не настроены" }, { status: 503 })
    const publicTariff = {
      priceSofa2: tariff.priceSofa2, priceSofa3: tariff.priceSofa3, priceSofaCorner: tariff.priceSofaCorner,
      priceArmchair: tariff.priceArmchair, priceRecliner: tariff.priceRecliner,
      priceMattressSingle: tariff.priceMattressSingle, priceMattressDouble: tariff.priceMattressDouble,
      priceChairSeat: tariff.priceChairSeat, priceChairBack: tariff.priceChairBack,
      minOrder: tariff.minOrder, strongDirtPercent: tariff.strongDirtPercent,
      mattressSecondSidePercent: tariff.mattressSecondSidePercent, outOfTownFee: tariff.outOfTownFee,
    }
    return NextResponse.json(publicTariff, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить цены" }, { status: 503 })
  }
}
