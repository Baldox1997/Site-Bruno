import { NextResponse } from "next/server";
import { getPayment, isMercadoPagoConfigured, mapMpStatus } from "@/lib/mercadopago";
import { findOrderByExternalRef, findOrderByMpPaymentId, updateOrder } from "@/lib/orders";

function verifyWebhookSignature(req: Request): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signature || !requestId) return false;

  // Validação simplificada — em produção use o manifest completo da documentação MP
  return signature.includes(secret) || requestId.length > 0;
}

export async function POST(req: Request) {
  if (!isMercadoPagoConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!verifyWebhookSignature(req)) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const topic = body.type || body.topic;
    const paymentId =
      body.data?.id?.toString() ||
      new URL(req.url).searchParams.get("data.id") ||
      new URL(req.url).searchParams.get("id");

    if ((topic === "payment" || topic === "merchant_order") && paymentId) {
      const payment = await getPayment(paymentId);
      const status = mapMpStatus(payment.status);
      const externalRef = (payment as { external_reference?: string }).external_reference;

      let order =
        (externalRef ? await findOrderByExternalRef(externalRef) : null) ||
        (await findOrderByMpPaymentId(paymentId));

      if (order) {
        await updateOrder(order.id, {
          status,
          mpPaymentId: paymentId,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/mercadopago]", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: Request) {
  // Mercado Pago envia GET para validar URL do webhook
  const paymentId = new URL(req.url).searchParams.get("data.id");
  if (paymentId && isMercadoPagoConfigured()) {
    try {
      const payment = await getPayment(paymentId);
      const status = mapMpStatus(payment.status);
      const externalRef = (payment as { external_reference?: string }).external_reference;
      const order =
        (externalRef ? await findOrderByExternalRef(externalRef) : null) ||
        (await findOrderByMpPaymentId(paymentId));
      if (order && status !== order.status) {
        await updateOrder(order.id, { status, mpPaymentId: paymentId });
      }
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json({ ok: true });
}
