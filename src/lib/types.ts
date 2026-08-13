export type Event = {
  id: string;
  nome: string;
  data: string;
  local: string;
  categoria: string;
  fotos: number;
  capa: string;
  publicado?: boolean;
};

export type Photo = {
  id: string;
  eventoId: string;
  evento: string;
  data: string;
  categoria: string;
  preco: number;
  img: string;
  publicado?: boolean;
};

export type Servico = {
  nome: string;
  desde: number;
  duracao: string;
  entrega: string;
  cat: string;
};

export type StoreSettings = {
  precoFoto: number;
  precoPacote5: number;
  precoPacoteCompleto: number;
  pagamentoAtivo: boolean;
  mercadoPagoConfigurado: boolean;
};

export type Promotion = {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  tipo: "percentual" | "fixo";
  valor: number;
  eventoId?: string;
  minFotos?: number;
  ativa: boolean;
  inicio: string;
  fim: string;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  evento: string;
  tipo: string;
  preco: number;
  qty: number;
  img?: string;
};

export type OrderStatus = "pending" | "approved" | "rejected" | "cancelled";

export type Order = {
  id: string;
  mpPaymentId?: string;
  mpPreferenceId?: string;
  status: OrderStatus;
  paymentMethod: "pix" | "credito" | "debito" | "simulado";
  total: number;
  payer: {
    nome: string;
    email: string;
    whatsapp: string;
    cpf: string;
  };
  items: OrderItem[];
  promoCode?: string;
  desconto?: number;
  subtotal?: number;
  createdAt: string;
  updatedAt: string;
};

export type StoreData = {
  events: Event[];
  photos: Photo[];
  servicos: Servico[];
  settings: StoreSettings;
  orders: Order[];
  promotions: Promotion[];
};

export type SessionPayload = {
  sub: string;
  email: string;
  role: "admin";
};
