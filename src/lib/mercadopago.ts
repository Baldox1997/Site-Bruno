const MP_API = "https://api.mercadopago.com";

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  return token;
}

async function mpFetch<T>(
  path: string,
  options: RequestInit & { idempotencyKey?: string } = {}
): Promise<T> {
  const { idempotencyKey, ...init } = options;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${MP_API}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.message ||
      data?.cause?.[0]?.description ||
      `Mercado Pago erro ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export type MpPixPayment = {
  id: number;
  status: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

export type MpPreference = {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
};

export async function createPixPayment(params: {
  orderId: string;
  amount: number;
  description: string;
  payer: { email: string; nome: string; cpf: string };
}): Promise<MpPixPayment> {
  const cpf = params.payer.cpf.replace(/\D/g, "");
  const [firstName, ...rest] = params.payer.nome.trim().split(/\s+/);
  const siteUrl = getSiteUrl();

  return mpFetch<MpPixPayment>("/v1/payments", {
    method: "POST",
    idempotencyKey: params.orderId,
    body: JSON.stringify({
      transaction_amount: params.amount,
      description: params.description,
      payment_method_id: "pix",
      external_reference: params.orderId,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      payer: {
        email: params.payer.email,
        first_name: firstName || "Cliente",
        last_name: rest.join(" ") || "BZ",
        identification: { type: "CPF", number: cpf },
      },
    }),
  });
}

export async function createCardPreference(params: {
  orderId: string;
  amount: number;
  items: { id: string; title: string; quantity: number; unit_price: number }[];
  payer: { email: string; nome: string; cpf: string };
  paymentMethod: "credito" | "debito";
}): Promise<MpPreference> {
  const cpf = params.payer.cpf.replace(/\D/g, "");
  const siteUrl = getSiteUrl();
  const isTest = getAccessToken().startsWith("TEST-");

  const excludedTypes = [{ id: "ticket" }, { id: "bank_transfer" }];
  const excludedMethods =
    params.paymentMethod === "credito"
      ? [{ id: "debit_card" }]
      : [{ id: "credit_card" }];

  return mpFetch<MpPreference>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: params.items,
      external_reference: params.orderId,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${siteUrl}/?checkout=success&order=${params.orderId}`,
        failure: `${siteUrl}/?checkout=failure&order=${params.orderId}`,
        pending: `${siteUrl}/?checkout=pending&order=${params.orderId}`,
      },
      auto_return: "approved",
      payer: {
        email: params.payer.email,
        name: params.payer.nome,
        identification: { type: "CPF", number: cpf },
      },
      payment_methods: {
        excluded_payment_types: excludedTypes,
        excluded_payment_methods: excludedMethods,
      },
      statement_descriptor: "BRUNO ZARATH",
      metadata: { order_id: params.orderId },
    }),
  }).then((pref) => {
    if (isTest && pref.sandbox_init_point) {
      return { ...pref, init_point: pref.sandbox_init_point };
    }
    return pref;
  });
}

export async function getPayment(paymentId: string): Promise<MpPixPayment & { status_detail?: string }> {
  return mpFetch(`/v1/payments/${paymentId}`);
}

export function mapMpStatus(status: string): "pending" | "approved" | "rejected" | "cancelled" {
  switch (status) {
    case "approved":
      return "approved";
    case "rejected":
    case "cancelled":
      return "rejected";
    case "refunded":
    case "charged_back":
      return "cancelled";
    default:
      return "pending";
  }
}
