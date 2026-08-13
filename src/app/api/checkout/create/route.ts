import { NextResponse } from "next/server";
import {
  createPixPayment,
  createCardPreference,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago";
import { createOrder } from "@/lib/orders";
import type { OrderItem } from "@/lib/types";

type Body = {
  items: OrderItem[];
  payer: { nome: string; email: string; whatsapp: string; cpf: string };
  paymentMethod: "pix" | "credito" | "debito";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const { items, payer, paymentMethod } = body;

    if (!items?.length || !payer?.email || !payer?.nome) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const total = Math.round(items.reduce((s, i) => s + i.preco * i.qty, 0) * 100) / 100;
    if (total <= 0) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 });
    }

    if (!isMercadoPagoConfigured()) {
      const order = await createOrder({
        items,
        payer,
        paymentMethod: "simulado",
        total,
        status: "approved",
      });
      return NextResponse.json({
        mode: "simulated",
        orderId: order.id,
        status: "approved",
        approved: true,
      });
    }

    const description = `Bruno Zarath — ${items.length} item(ns)`;

    if (paymentMethod === "pix") {
      const order = await createOrder({
        items,
        payer,
        paymentMethod: "pix",
        total,
        status: "pending",
      });

      const payment = await createPixPayment({
        orderId: order.id,
        amount: total,
        description,
        payer,
      });

      const tx = payment.point_of_interaction?.transaction_data;
      const { updateOrder } = await import("@/lib/orders");
      await updateOrder(order.id, { mpPaymentId: String(payment.id) });

      return NextResponse.json({
        mode: "live",
        orderId: order.id,
        paymentMethod: "pix",
        mpPaymentId: String(payment.id),
        status: "pending",
        pix: {
          qrCode: tx?.qr_code ?? "",
          qrCodeBase64: tx?.qr_code_base64 ?? "",
          ticketUrl: tx?.ticket_url ?? "",
        },
      });
    }

    const order = await createOrder({
      items,
      payer,
      paymentMethod,
      total,
      status: "pending",
    });

    const mpItems = items.map((it) => ({
      id: it.id,
      title: `${it.evento} — ${it.tipo}`,
      quantity: it.qty,
      unit_price: it.preco,
      currency_id: "BRL",
    }));

    const preference = await createCardPreference({
      orderId: order.id,
      amount: total,
      items: mpItems,
      payer,
      paymentMethod,
    });

    const { updateOrder } = await import("@/lib/orders");
    await updateOrder(order.id, { mpPreferenceId: preference.id });

    return NextResponse.json({
      mode: "live",
      orderId: order.id,
      paymentMethod,
      mpPreferenceId: preference.id,
      status: "pending",
      redirectUrl: preference.init_point,
    });
  } catch (err) {
    console.error("[checkout/create]", err);
    const message =
      process.env.NODE_ENV === "production"
        ? "Erro ao criar pagamento"
        : err instanceof Error
          ? err.message
          : "Erro ao criar pagamento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
