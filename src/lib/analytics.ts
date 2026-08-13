import type { Order } from "./types";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export type RevenuePoint = { m: string; v: number; pedidos: number; fotos: number; ticket: number };
export type EventRevenue = { n: string; v: number; fotos: number; pedidos: number };
export type PaymentSplit = { metodo: string; v: number; qtd: number; ticket: number };
export type DailySale = { dia: string; v: number; pedidos: number };
export type SalesInsight = { label: string; value: string; hint: string; trend?: "up" | "down" | "neutral" };

function approvedOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.status === "approved");
}

export function revenueByMonth(orders: Order[], months = 6): RevenuePoint[] {
  const approved = approvedOrders(orders);
  const now = new Date();
  const points: RevenuePoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = MONTHS[d.getMonth()];
    const monthOrders = approved.filter((o) => {
      const od = new Date(o.createdAt);
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
    });
    points.push({
      m: label,
      v: monthOrders.reduce((s, o) => s + o.total, 0),
      pedidos: monthOrders.length,
      fotos: monthOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0),
      ticket: monthOrders.length
        ? monthOrders.reduce((s, o) => s + o.total, 0) / monthOrders.length
        : 0,
    });
  }
  return points;
}

export function revenueByEvent(orders: Order[]): EventRevenue[] {
  const map = new Map<string, { v: number; fotos: number; pedidos: Set<string> }>();
  for (const o of approvedOrders(orders)) {
    for (const item of o.items) {
      const cur = map.get(item.evento) ?? { v: 0, fotos: 0, pedidos: new Set() };
      cur.v += item.preco * item.qty;
      cur.fotos += item.qty;
      cur.pedidos.add(o.id);
      map.set(item.evento, cur);
    }
  }
  return [...map.entries()]
    .map(([n, { v, fotos, pedidos }]) => ({
      n: n.length > 18 ? n.slice(0, 16) + "…" : n,
      v,
      fotos,
      pedidos: pedidos.size,
    }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 8);
}

export function revenueByPaymentMethod(orders: Order[]): PaymentSplit[] {
  const map = new Map<string, { v: number; qtd: number }>();
  const labels: Record<string, string> = {
    pix: "PIX",
    credito: "Crédito",
    debito: "Débito",
    simulado: "Simulado",
  };
  for (const o of approvedOrders(orders)) {
    const key = o.paymentMethod;
    const cur = map.get(key) ?? { v: 0, qtd: 0 };
    cur.v += o.total;
    cur.qtd += 1;
    map.set(key, cur);
  }
  return [...map.entries()].map(([k, { v, qtd }]) => ({
    metodo: labels[k] ?? k,
    v,
    qtd,
    ticket: qtd ? v / qtd : 0,
  }));
}

export function revenueByDay(orders: Order[], days = 14): DailySale[] {
  const approved = approvedOrders(orders);
  const points: DailySale[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOrders = approved.filter((o) => {
      const od = new Date(o.createdAt);
      return od.toDateString() === d.toDateString();
    });
    points.push({
      dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      v: dayOrders.reduce((s, o) => s + o.total, 0),
      pedidos: dayOrders.length,
    });
  }
  return points;
}

export function salesInsights(orders: Order[]): SalesInsight[] {
  const approved = approvedOrders(orders);
  const pending = orders.filter((o) => o.status === "pending");
  const totalDesconto = approved.reduce((s, o) => s + (o.desconto ?? 0), 0);
  const comCupom = approved.filter((o) => o.promoCode).length;
  const pix = approved.filter((o) => o.paymentMethod === "pix").length;
  const summary = revenueSummary(orders);

  return [
    {
      label: "Receita confirmada",
      value: fmtBrl(summary.total),
      hint: `${summary.pedidos} pedidos · ${summary.fotos} fotos vendidas`,
      trend: summary.mesAtual > 0 ? "up" : "neutral",
    },
    {
      label: "Ticket médio",
      value: fmtBrl(summary.ticketMedio),
      hint: "Valor médio por compra aprovada",
    },
    {
      label: "Descontos (cupons)",
      value: fmtBrl(totalDesconto),
      hint: `${comCupom} pedido(s) usaram promoção`,
    },
    {
      label: "Aguardando pagamento",
      value: String(pending.length),
      hint: pending.length ? fmtBrl(pending.reduce((s, o) => s + o.total, 0)) + " em aberto" : "Nenhum pendente",
      trend: pending.length ? "down" : "neutral",
    },
    {
      label: "PIX vs cartão",
      value: approved.length ? `${Math.round((pix / approved.length) * 100)}% PIX` : "—",
      hint: "Preferência de pagamento dos clientes",
    },
  ];
}

function fmtBrl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function revenueSummary(orders: Order[]) {
  const approved = approvedOrders(orders);
  const total = approved.reduce((s, o) => s + o.total, 0);
  const fotos = approved.reduce((s, o) => s + o.items.reduce((a, i) => a + i.qty, 0), 0);
  const ticketMedio = approved.length ? total / approved.length : 0;

  const now = new Date();
  const thisMonth = approved.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const mesAtual = thisMonth.reduce((s, o) => s + o.total, 0);

  return { total, fotos, ticketMedio, pedidos: approved.length, mesAtual };
}
