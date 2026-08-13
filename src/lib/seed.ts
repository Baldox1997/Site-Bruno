import type { StoreData } from "./types";

function img(seed: string, w = 900, h = 1200) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const EVENTS = [
  { id: "mc26", nome: "Maratona de Curitiba", data: "15/08/2026", local: "Curitiba, PR", categoria: "Esportes", fotos: 812, capa: img("mc26-cover", 1200, 800), publicado: true },
  { id: "cev26", nome: "Campeonato Estadual de Vôlei", data: "08/08/2026", local: "Curitiba, PR", categoria: "Esportes", fotos: 356, capa: img("cev26-cover", 1200, 800), publicado: true },
  { id: "aer26", nome: "Casamento Ana & Rafael", data: "01/08/2026", local: "Morretes, PR", categoria: "Eventos", fotos: 540, capa: img("aer26-cover", 1200, 800), publicado: true },
  { id: "fs26", nome: "Festival Sonora", data: "25/07/2026", local: "Curitiba, PR", categoria: "Shows", fotos: 421, capa: img("fs26-cover", 1200, 800), publicado: true },
];

function makePhotos() {
  const list = [];
  for (const ev of EVENTS) {
    for (let i = 1; i <= 8; i++) {
      list.push({
        id: `${ev.id}-${i}`,
        eventoId: ev.id,
        evento: ev.nome,
        data: ev.data,
        categoria: ev.categoria,
        preco: 19.9,
        img: img(`${ev.id}-${i}`, 900, 1200),
        publicado: true,
      });
    }
  }
  return list;
}

export const defaultStore = (): StoreData => ({
  events: EVENTS,
  photos: makePhotos(),
  servicos: [
    { nome: "Ensaio Fotográfico", desde: 450, duracao: "1–2h", entrega: "30 fotos editadas", cat: "Ensaios" },
    { nome: "Cobertura de Eventos", desde: 800, duracao: "4–8h", entrega: "Galeria completa em até 5 dias", cat: "Eventos" },
    { nome: "Fotografia Esportiva", desde: 600, duracao: "2–4h", entrega: "Galeria pública para venda", cat: "Esportes" },
    { nome: "Fotografia Corporativa", desde: 500, duracao: "2–4h", entrega: "Banco de imagens da marca", cat: "Corporativo" },
  ],
  settings: {
    precoFoto: 19.9,
    precoPacote5: 69.9,
    precoPacoteCompleto: 119.9,
    pagamentoAtivo: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
    mercadoPagoConfigurado: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
  },
  orders: [],
  promotions: [
    {
      id: "promo_bemvindo",
      codigo: "BZ10",
      titulo: "10% na primeira compra",
      descricao: "Desconto de 10% em pedidos com 2+ fotos",
      tipo: "percentual",
      valor: 10,
      minFotos: 2,
      ativa: true,
      inicio: "2026-01-01",
      fim: "2026-12-31",
      createdAt: new Date().toISOString(),
    },
  ],
});
