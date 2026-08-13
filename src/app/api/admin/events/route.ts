import { NextResponse } from "next/server";
import { getStore, saveStore } from "@/lib/store";
import type { Event } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const store = await getStore();
  const id = body.id || `ev-${Date.now()}`;
  const evento: Event = {
    id,
    nome: body.nome,
    data: body.data,
    local: body.local,
    categoria: body.categoria,
    fotos: 0,
    capa: body.capa || "https://picsum.photos/seed/default/1200/800",
    publicado: body.publicado !== false,
  };
  store.events.unshift(evento);
  await saveStore(store);
  return NextResponse.json({ ok: true, event: evento });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const store = await getStore();
  const idx = store.events.findIndex((e) => e.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  store.events[idx] = { ...store.events[idx], ...body };
  await saveStore(store);
  return NextResponse.json({ ok: true, event: store.events[idx] });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  const store = await getStore();
  store.events = store.events.filter((e) => e.id !== id);
  store.photos = store.photos.filter((p) => p.eventoId !== id);
  await saveStore(store);
  return NextResponse.json({ ok: true });
}
