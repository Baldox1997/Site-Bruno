"use client";

import { Camera, ExternalLink, FolderOpen, ShoppingBag } from "lucide-react";

type Props = {
  photos: number;
  events: number;
  orders: number;
  siteUrl?: string;
};

export default function AdminStatusBar({
  photos,
  events,
  orders,
  siteUrl = "https://brunozarath.vercel.app",
}: Props) {
  return (
    <div className="adminstatus" role="region" aria-label="Resumo do painel">
      <div className="adminstatus__stat" title="Fotos publicadas">
        <Camera size={14} aria-hidden />
        <strong>{photos}</strong>
        <span>fotos</span>
      </div>
      <div className="adminstatus__stat" title="Eventos ativos">
        <FolderOpen size={14} aria-hidden />
        <strong>{events}</strong>
        <span>eventos</span>
      </div>
      <div className="adminstatus__stat" title="Pedidos aprovados">
        <ShoppingBag size={14} aria-hidden />
        <strong>{orders}</strong>
        <span>vendas</span>
      </div>
      <a
        href={siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="adminstatus__live"
        aria-label="Abrir site ao vivo em nova aba"
      >
        <span className="adminstatus__dot" aria-hidden />
        Site ao vivo <ExternalLink size={12} aria-hidden />
      </a>
    </div>
  );
}
