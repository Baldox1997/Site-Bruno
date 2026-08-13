import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import {
  revenueByMonth,
  revenueByEvent,
  revenueByPaymentMethod,
  revenueSummary,
  revenueByDay,
  salesInsights,
} from "@/lib/analytics";

export async function GET() {
  const store = await getStore();
  const orders = store.orders ?? [];

  return NextResponse.json({
    summary: revenueSummary(orders),
    byMonth: revenueByMonth(orders, 6),
    byEvent: revenueByEvent(orders),
    byPayment: revenueByPaymentMethod(orders),
    byDay: revenueByDay(orders, 14),
    insights: salesInsights(orders),
  });
}
