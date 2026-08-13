import { NextResponse } from "next/server";
import { getStore, saveStore } from "@/lib/store";
import { newPromotionId } from "@/lib/promotions";
import type { Promotion } from "@/lib/types";

export async function GET() {
  const store = await getStore();
  return NextResponse.json({ promotions: store.promotions ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  const store = await getStore();
  const now = new Date().toISOString();

  const promo: Promotion = {
    id: newPromotionId(),
    codigo: String(body.codigo || "").trim().toUpperCase(),
    titulo: String(body.titulo || ""),
    descricao: String(body.descricao || ""),
    tipo: body.tipo === "fixo" ? "fixo" : "percentual",
    valor: Number(body.valor) || 0,
    eventoId: body.eventoId || undefined,
    minFotos: body.minFotos ? Number(body.minFotos) : undefined,
    ativa: body.ativa !== false,
    inicio: body.inicio || now.slice(0, 10),
    fim: body.fim || "2099-12-31",
    createdAt: now,
  };

  if (!promo.codigo || !promo.titulo || promo.valor <= 0) {
    return NextResponse.json({ error: "Preencha código, título e valor" }, { status: 400 });
  }

  if (!store.promotions) store.promotions = [];
  if (store.promotions.some((p) => p.codigo === promo.codigo)) {
    return NextResponse.json({ error: "Código já existe" }, { status: 409 });
  }

  store.promotions.unshift(promo);
  await saveStore(store);
  return NextResponse.json({ ok: true, promotion: promo });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const store = await getStore();
  const idx = store.promotions?.findIndex((p) => p.id === body.id) ?? -1;
  if (idx === -1) {
    return NextResponse.json({ error: "Promoção não encontrada" }, { status: 404 });
  }

  store.promotions[idx] = {
    ...store.promotions[idx],
    ...body,
    codigo: body.codigo
      ? String(body.codigo).trim().toUpperCase()
      : store.promotions[idx].codigo,
  };
  await saveStore(store);
  return NextResponse.json({ ok: true, promotion: store.promotions[idx] });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const store = await getStore();
  store.promotions = (store.promotions ?? []).filter((p) => p.id !== id);
  await saveStore(store);
  return NextResponse.json({ ok: true });
}
