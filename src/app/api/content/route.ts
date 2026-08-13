import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getActivePromotions } from "@/lib/promotions";

export async function GET() {
  const store = await getStore();
  const promotions = getActivePromotions(store.promotions ?? []).map((p) => ({
    codigo: p.codigo,
    titulo: p.titulo,
    descricao: p.descricao,
    tipo: p.tipo,
    valor: p.valor,
    minFotos: p.minFotos,
  }));

  return NextResponse.json({
    events: store.events.filter((e) => e.publicado !== false),
    photos: store.photos.filter((p) => p.publicado !== false),
    servicos: store.servicos,
    promotions,
    settings: {
      precoFoto: store.settings.precoFoto,
      precoPacote5: store.settings.precoPacote5,
      precoPacoteCompleto: store.settings.precoPacoteCompleto,
    },
  });
}
