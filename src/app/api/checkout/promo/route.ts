import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { findPromotionByCode, applyPromoToItems } from "@/lib/promotions";
import type { OrderItem } from "@/lib/types";

export async function POST(req: Request) {
  const { codigo, items } = (await req.json()) as {
    codigo: string;
    items: OrderItem[];
  };

  if (!codigo?.trim()) {
    return NextResponse.json({ error: "Informe o código" }, { status: 400 });
  }

  const store = await getStore();
  const promo = findPromotionByCode(store.promotions ?? [], codigo);

  if (!promo) {
    return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 404 });
  }

  const pricing = applyPromoToItems(items ?? [], promo);

  if (pricing.discount <= 0) {
    return NextResponse.json({
      error: promo.minFotos
        ? `Mínimo de ${promo.minFotos} fotos para este cupom`
        : "Cupom não aplicável",
    }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    promo: { codigo: promo.codigo, titulo: promo.titulo },
    ...pricing,
  });
}
