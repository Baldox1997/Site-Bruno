"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Event, Photo, Servico, StoreSettings, Promotion } from "@/lib/types";
import { defaultStore } from "@/lib/seed";

type PublicPromotion = Pick<Promotion, "codigo" | "titulo" | "descricao" | "tipo" | "valor" | "minFotos">;

type ContentState = {
  events: Event[];
  photos: Photo[];
  servicos: Servico[];
  promotions: PublicPromotion[];
  settings: Pick<StoreSettings, "precoFoto" | "precoPacote5" | "precoPacoteCompleto">;
  loading: boolean;
  refresh: () => Promise<void>;
};

const ContentContext = createContext<ContentState | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const seed = defaultStore();
  const [events, setEvents] = useState<Event[]>(seed.events);
  const [photos, setPhotos] = useState<Photo[]>(seed.photos);
  const [servicos, setServicos] = useState<Servico[]>(seed.servicos);
  const [promotions, setPromotions] = useState<PublicPromotion[]>([]);
  const [settings, setSettings] = useState({
    precoFoto: seed.settings.precoFoto,
    precoPacote5: seed.settings.precoPacote5,
    precoPacoteCompleto: seed.settings.precoPacoteCompleto,
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events);
      setPhotos(data.photos);
      setServicos(data.servicos);
      setPromotions(data.promotions ?? []);
      setSettings(data.settings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <ContentContext.Provider value={{ events, photos, servicos, promotions, settings, loading, refresh }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}
