import { NextResponse } from "next/server";
import { getPayment, isMercadoPagoConfigured, mapMpStatus } from "@/lib/mercadopago";
import { getOrderById, updateOrder } from "@/lib/orders";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  if (order.status === "approved" || order.status === "rejected" || order.status === "cancelled") {
    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      total: order.total,
    });
  }

  if (isMercadoPagoConfigured() && order.mpPaymentId) {
    try {
      const payment = await getPayment(order.mpPaymentId);
      const status = mapMpStatus(payment.status);
      if (status !== order.status) {
        await updateOrder(order.id, { status });
        order.status = status;
      }
    } catch (err) {
      console.error("[checkout/status]", err);
    }
  }

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    total: order.total,
  });
}
