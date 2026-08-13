import { NextResponse } from "next/server";
import { getStore, saveStore, uploadImage } from "@/lib/store";
import type { Photo } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const form = await req.formData();
  const eventoId = String(form.get("eventoId") || "");
  const preco = Number(form.get("preco") || 19.9);
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (!eventoId || files.length === 0) {
    return NextResponse.json({ error: "Evento e arquivos obrigatórios" }, { status: 400 });
  }

  const store = await getStore();
  const evento = store.events.find((e) => e.id === eventoId);
  if (!evento) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const added: Photo[] = [];
  for (const file of files) {
    const url = await uploadImage(file);
    const id = `${eventoId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const photo: Photo = {
      id,
      eventoId,
      evento: evento.nome,
      data: evento.data,
      categoria: evento.categoria,
      preco,
      img: url,
      publicado: true,
    };
    store.photos.unshift(photo);
    added.push(photo);
  }

  evento.fotos = store.photos.filter((p) => p.eventoId === eventoId).length;
  await saveStore(store);

  return NextResponse.json({ ok: true, added, total: added.length });
}
