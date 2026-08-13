import type { Order, OrderItem, OrderStatus, StoreData } from "./types";
import { getStore, saveStore } from "./store";
import { normalizePromotions } from "./promotions";

function newOrderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeStore(data: StoreData): StoreData {
  if (!Array.isArray(data.orders)) {
    data.orders = [];
  }
  data.promotions = normalizePromotions(data.promotions);
  return data;
}

export async function getOrders(): Promise<Order[]> {
  const store = normalizeStore(await getStore());
  return store.orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrderById(id: string): Promise<Order | null> {
  const store = normalizeStore(await getStore());
  return store.orders.find((o) => o.id === id) ?? null;
}

export async function createOrder(params: {
  items: OrderItem[];
  payer: Order["payer"];
  paymentMethod: Order["paymentMethod"];
  total: number;
  status?: OrderStatus;
  mpPaymentId?: string;
  mpPreferenceId?: string;
  promoCode?: string;
  desconto?: number;
  subtotal?: number;
}): Promise<Order> {
  const store = normalizeStore(await getStore());
  const now = new Date().toISOString();
  const order: Order = {
    id: newOrderId(),
    status: params.status ?? "pending",
    paymentMethod: params.paymentMethod,
    total: params.total,
    payer: params.payer,
    items: params.items,
    mpPaymentId: params.mpPaymentId,
    mpPreferenceId: params.mpPreferenceId,
    promoCode: params.promoCode,
    desconto: params.desconto,
    subtotal: params.subtotal,
    createdAt: now,
    updatedAt: now,
  };
  store.orders.unshift(order);
  await saveStore(store);
  return order;
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "mpPaymentId" | "mpPreferenceId">>
): Promise<Order | null> {
  const store = normalizeStore(await getStore());
  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  store.orders[idx] = {
    ...store.orders[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await saveStore(store);
  return store.orders[idx];
}

export async function findOrderByMpPaymentId(paymentId: string): Promise<Order | null> {
  const store = normalizeStore(await getStore());
  return store.orders.find((o) => o.mpPaymentId === paymentId) ?? null;
}

export async function findOrderByExternalRef(ref: string): Promise<Order | null> {
  return getOrderById(ref);
}
