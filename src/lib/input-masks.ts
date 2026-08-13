export type MaskType = "date" | "phone" | "cpf" | "currency" | "cep";

const digits = (v: string) => v.replace(/\D/g, "");

export function maskDate(value: string): string {
  const d = digits(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function maskPhone(value: string): string {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskCpf(value: string): string {
  const d = digits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskCep(value: string): string {
  const d = digits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function maskCurrency(value: string): string {
  const d = digits(value);
  if (!d) return "";
  const n = Number(d) / 100;
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseCurrency(masked: string): number {
  const d = digits(masked);
  return d ? Number(d) / 100 : 0;
}

export function applyMask(type: MaskType, value: string): string {
  switch (type) {
    case "date": return maskDate(value);
    case "phone": return maskPhone(value);
    case "cpf": return maskCpf(value);
    case "cep": return maskCep(value);
    case "currency": return maskCurrency(value);
    default: return value;
  }
}

export const MASK_PLACEHOLDERS: Record<MaskType, string> = {
  date: "DD/MM/AAAA",
  phone: "(00) 00000-0000",
  cpf: "000.000.000-00",
  cep: "00000-000",
  currency: "0,00",
};
