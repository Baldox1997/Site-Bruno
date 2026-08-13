import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isMercadoPagoConfigured } from "@/lib/mercadopago";

export async function GET() {
  const store = await getStore();
  const mpConfigured = isMercadoPagoConfigured();
  const active = mpConfigured && store.settings.pagamentoAtivo;

  return NextResponse.json({
    paymentsActive: active,
    mercadoPagoConfigured: mpConfigured,
    simulated: !active,
  });
}
