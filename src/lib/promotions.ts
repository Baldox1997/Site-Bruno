import type { OrderItem, Promotion } from "./types";

export function normalizePromotions(list: Promotion[] | undefined): Promotion[] {
  return Array.isArray(list) ? list : [];
}

export function isPromotionActive(p: Promotion, now = new Date()): boolean {
  if (!p.ativa) return false;
  const start = new Date(p.inicio);
  const end = new Date(p.fim);
  end.setHours(23, 59, 59, 999);
  return now >= start && now <= end;
}

export function getActivePromotions(promotions: Promotion[]): Promotion[] {
  return promotions.filter((p) => isPromotionActive(p));
}

export function findPromotionByCode(
  promotions: Promotion[],
  codigo: string
): Promotion | null {
  const code = codigo.trim().toUpperCase();
  return (
    promotions.find(
      (p) => p.codigo.toUpperCase() === code && isPromotionActive(p)
    ) ?? null
  );
}

export function calcDiscount(
  promo: Promotion,
  subtotal: number,
  itemCount: number
): number {
  if (promo.minFotos && itemCount < promo.minFotos) return 0;
  if (promo.tipo === "percentual") {
    return Math.round(subtotal * (promo.valor / 100) * 100) / 100;
  }
  return Math.min(promo.valor, subtotal);
}

export function applyPromoToItems(
  items: OrderItem[],
  promo: Promotion | null
): { subtotal: number; discount: number; total: number; itemCount: number } {
  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.preco * i.qty, 0);
  const discount = promo ? calcDiscount(promo, subtotal, itemCount) : 0;
  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    itemCount,
  };
}

export function newPromotionId(): string {
  return `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
