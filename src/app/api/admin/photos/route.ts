import { NextResponse } from "next/server";
import { removePhotoFromIndex } from "@/lib/face-index";
import { getStore, saveStore } from "@/lib/store";

export async function PATCH(req: Request) {
  const body = await req.json();

  if (Array.isArray(body.ids) && body.preco != null) {
    const store = await getStore();
    const ids = new Set(body.ids as string[]);
    store.photos = store.photos.map((p) =>
      ids.has(p.id) ? { ...p, preco: Number(body.preco) } : p
    );
    await saveStore(store);
    return NextResponse.json({ ok: true, updated: ids.size });
  }

  const store = await getStore();
  const idx = store.photos.findIndex((p) => p.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  store.photos[idx] = { ...store.photos[idx], ...body };
  await saveStore(store);
  return NextResponse.json({ ok: true, photo: store.photos[idx] });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  const store = await getStore();
  const photo = store.photos.find((p) => p.id === id);
  store.photos = store.photos.filter((p) => p.id !== id);
  if (photo) {
    const ev = store.events.find((e) => e.id === photo.eventoId);
    if (ev) ev.fotos = store.photos.filter((p) => p.eventoId === ev.id).length;
  }
  await saveStore(store);
  try {
    await removePhotoFromIndex(id);
  } catch {
    /* índice facial opcional */
  }
  return NextResponse.json({ ok: true });
}
