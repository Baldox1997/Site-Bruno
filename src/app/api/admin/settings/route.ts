import { NextResponse } from "next/server";
import { getStore, saveStore } from "@/lib/store";

export async function PATCH(req: Request) {
  const body = await req.json();
  const store = await getStore();
  store.settings = { ...store.settings, ...body.settings };
  await saveStore(store);
  return NextResponse.json({
    ok: true,
    settings: {
      ...store.settings,
      mercadoPagoConfigurado: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
      pagamentoAtivo: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN) && store.settings.pagamentoAtivo,
    },
  });
}

export async function GET() {
  const store = await getStore();
  return NextResponse.json({
    settings: store.settings,
    payment: {
      mercadoPagoConfigurado: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
      chavePublicaDefinida: Boolean(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY),
      aviso: "Configure na Vercel: MERCADOPAGO_ACCESS_TOKEN, NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY e opcional MERCADOPAGO_WEBHOOK_SECRET. Ative 'Venda ativa' abaixo.",
    },
  });
}
