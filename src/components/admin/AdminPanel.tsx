"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, Upload, FolderOpen, Image as ImageIcon, Settings, Wallet,
  LogOut, Plus, Trash2, LayoutDashboard, Check, Tag, TrendingUp
} from "lucide-react";
import "@/components/bruno-zarath/bruno-zarath.css";
import { AdminDashboardCharts, AdminFinanceChart } from "@/components/bruno-zarath/AdminCharts";
import AdminUpload from "@/components/admin/AdminUpload";
import AdminPromotions from "@/components/admin/AdminPromotions";
import AdminPhotoManager from "@/components/admin/AdminPhotoManager";
import AdminFaceIndex from "@/components/admin/AdminFaceIndex";
import AdminStatusBar from "@/components/admin/AdminStatusBar";
import MaskedInput from "@/components/ui/MaskedInput";
import type { Event, Photo, StoreData } from "@/lib/types";
import type { RevenuePoint, EventRevenue, PaymentSplit, DailySale, SalesInsight } from "@/lib/analytics";

const CATEGORIES = ["Eventos", "Esportes", "Ensaios", "Retratos", "Shows", "Lifestyle", "Automotivo", "Corporativo"];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState("dashboard");
  const [store, setStore] = useState<StoreData | null>(null);
  const [payment, setPayment] = useState<{ mercadoPagoConfigurado: boolean; chavePublicaDefinida: boolean; aviso: string } | null>(null);
  const [analytics, setAnalytics] = useState<{
    summary: { total: number; mesAtual: number; pedidos: number; ticketMedio: number; fotos: number };
    byMonth: RevenuePoint[];
    byEvent: EventRevenue[];
    byPayment: PaymentSplit[];
    byDay: DailySale[];
    insights: SalesInsight[];
  } | null>(null);
  const [msg, setMsg] = useState("");
  const [loadError, setLoadError] = useState("");
  const [newEventForm, setNewEventForm] = useState({ nome: "", data: "", local: "", categoria: "Esportes" });

  const load = async () => {
    setLoadError("");
    const [storeRes, settingsRes, analyticsRes] = await Promise.all([
      fetch("/api/admin/store"),
      fetch("/api/admin/settings"),
      fetch("/api/admin/analytics"),
    ]);

    if (storeRes.status === 401 || settingsRes.status === 401) {
      router.replace("/admin/login");
      return;
    }

    if (!storeRes.ok) {
      const err = await storeRes.json().catch(() => ({}));
      setLoadError(err.error || "Não foi possível carregar o painel.");
      return;
    }

    const s = await storeRes.json();
    const p = settingsRes.ok ? await settingsRes.json() : { payment: null };
    setStore(s);
    setPayment(p.payment);
    if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
  };

  useEffect(() => { load(); }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function saveSettings() {
    if (!store) return;
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: store.settings }),
    });
    setMsg("Configurações salvas.");
    load();
  }

  async function createEventInline() {
    if (!newEventForm.nome || !newEventForm.data || !newEventForm.local) return;
    await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEventForm),
    });
    setNewEventForm({ nome: "", data: "", local: "", categoria: "Esportes" });
    setMsg("Evento criado.");
    load();
  }

  async function deleteEvent(id: string) {
    if (!confirm("Remover evento e todas as fotos?")) return;
    await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
    load();
  }

  if (loadError) {
    return (
      <div className="bz admin">
        <div className="admin__main">
          <h1 className="admin__title">Erro ao carregar</h1>
          <p className="page__lead">{loadError}</p>
          <button className="btn btn--primary" type="button" onClick={() => load()}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (!store) {
    return <div className="bz admin"><div className="admin__main"><p>Carregando painel…</p></div></div>;
  }

  const tabs = [
    ["dashboard", "Visão geral", LayoutDashboard],
    ["upload", "Upload", Upload],
    ["vendas", "Vendas", TrendingUp],
    ["promos", "Promoções", Tag],
    ["eventos", "Eventos", FolderOpen],
    ["fotos", "Fotos", ImageIcon],
    ["config", "Config", Settings],
  ] as const;

  const summary = analytics?.summary;

  return (
    <div className="bz admin">
      <aside className="adminsidebar">
        <div className="adminsidebar__brand"><Camera size={16} /> Painel BZ</div>
        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? "is-active" : ""} onClick={() => { setTab(id); setMsg(""); }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <button className="adminsidebar__exit" onClick={logout}><LogOut size={15} /> Sair</button>
      </aside>

      <div className="admin__main">
        <AdminStatusBar
          photos={store.photos.length}
          events={store.events.length}
          orders={store.orders?.filter((o) => o.status === "approved").length ?? 0}
        />
        {msg && (
          <p className="admin__toast">
            <Check size={14} />{msg}
          </p>
        )}

        {tab === "dashboard" && (
          <>
            <h1 className="admin__title">Visão geral</h1>
            <div className="kpirow">
              <div className="kpi"><span className="kpi__label">Lucro total</span><strong className="kpi__value">{fmt(summary?.total ?? 0)}</strong></div>
              <div className="kpi"><span className="kpi__label">Este mês</span><strong className="kpi__value">{fmt(summary?.mesAtual ?? 0)}</strong></div>
              <div className="kpi"><span className="kpi__label">Pedidos</span><strong className="kpi__value">{summary?.pedidos ?? 0}</strong></div>
              <div className="kpi"><span className="kpi__label">Fotos no ar</span><strong className="kpi__value">{store.photos.length}</strong></div>
              <div className="kpi"><span className="kpi__label">Promoções</span><strong className="kpi__value">{store.promotions?.length ?? 0}</strong></div>
            </div>
            {analytics && (
              <AdminDashboardCharts
                byMonth={analytics.byMonth}
                byEvent={analytics.byEvent}
                byPayment={analytics.byPayment}
                byDay={analytics.byDay}
                insights={analytics.insights}
              />
            )}
            <div className="quickactions">
              <button type="button" className="btn btn--primary btn--sm" onClick={() => setTab("upload")}>Upload de fotos</button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setTab("promos")}>Nova promoção</button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setTab("vendas")}>Ver vendas</button>
            </div>
          </>
        )}

        {tab === "upload" && (
          <>
            <h1 className="admin__title">Publicar fotos</h1>
            <AdminUpload
              events={store.events}
              defaultPreco={store.settings.precoFoto}
              onDone={(m) => { setMsg(m); load(); }}
              onEventsChange={load}
            />
          </>
        )}

        {tab === "vendas" && (
          <>
            <h1 className="admin__title">Vendas e pagamentos</h1>
            <div className="kpirow" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
              <div className="kpi"><span className="kpi__label">Ticket médio</span><strong className="kpi__value">{fmt(summary?.ticketMedio ?? 0)}</strong></div>
              <div className="kpi"><span className="kpi__label">Fotos vendidas</span><strong className="kpi__value">{summary?.fotos ?? 0}</strong></div>
              <div className="kpi"><span className="kpi__label">Mercado Pago</span><strong className="kpi__value">{payment?.mercadoPagoConfigurado ? "Ativo" : "Demo"}</strong></div>
              <div className="kpi"><span className="kpi__label">Aprovados</span><strong className="kpi__value">{store.orders?.filter((o) => o.status === "approved").length ?? 0}</strong></div>
            </div>
            {analytics && (
              <div className="insightgrid insightgrid--compact" style={{ marginBottom: 16 }}>
                {analytics.insights.slice(0, 3).map((ins) => (
                  <div key={ins.label} className="insightcard">
                    <span className="insightcard__label">{ins.label}</span>
                    <strong className="insightcard__value">{ins.value}</strong>
                  </div>
                ))}
              </div>
            )}
            {analytics && <AdminFinanceChart byMonth={analytics.byMonth} />}
            {(store.orders?.length ?? 0) > 0 ? (
              <table className="admintable" style={{ marginTop: 24 }}>
                <thead>
                  <tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Cupom</th><th>Método</th><th>Status</th><th>Data</th></tr>
                </thead>
                <tbody>
                  {store.orders.map((o) => (
                    <tr key={o.id}>
                      <td className="admintable__main">{o.id.slice(-8)}</td>
                      <td>{o.payer.nome}</td>
                      <td>{fmt(o.total)}{o.desconto ? <span style={{ fontSize: 10, color: "var(--accent2)" }}> (-{fmt(o.desconto)})</span> : null}</td>
                      <td>{o.promoCode ?? "—"}</td>
                      <td>{o.paymentMethod}</td>
                      <td><span className={`statuspill statuspill--${o.status}`}>{o.status}</span></td>
                      <td>{new Date(o.createdAt).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="page__lead" style={{ marginTop: 24 }}>Nenhum pedido ainda. Vendas aparecem aqui após checkout.</p>
            )}
          </>
        )}

        {tab === "promos" && (
          <>
            <h1 className="admin__title">Promoções</h1>
            <AdminPromotions
              promotions={store.promotions ?? []}
              onRefresh={load}
              onMsg={setMsg}
            />
          </>
        )}

        {tab === "eventos" && (
          <>
            <h1 className="admin__title">Eventos</h1>
            <div className="eventnew form" style={{ maxWidth: 520, marginBottom: 24 }}>
              <div className="form__grid">
                <label>Nome<input value={newEventForm.nome} onChange={(e) => setNewEventForm({ ...newEventForm, nome: e.target.value })} placeholder="Maratona 2026" /></label>
                <label>Data<MaskedInput mask="date" value={newEventForm.data} onChange={(v) => setNewEventForm({ ...newEventForm, data: v })} /></label>
              </div>
              <div className="form__grid">
                <label>Local<input value={newEventForm.local} onChange={(e) => setNewEventForm({ ...newEventForm, local: e.target.value })} placeholder="Curitiba, PR" /></label>
                <label>Categoria
                  <select value={newEventForm.categoria} onChange={(e) => setNewEventForm({ ...newEventForm, categoria: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <button className="btn btn--primary btn--sm" type="button" onClick={createEventInline}><Plus size={14} /> CRIAR</button>
            </div>
            <table className="admintable">
              <thead><tr><th>Evento</th><th>Data</th><th>Fotos</th><th></th></tr></thead>
              <tbody>
                {store.events.map((e: Event) => (
                  <tr key={e.id}>
                    <td className="admintable__main"><img src={e.capa} alt="" /> {e.nome}</td>
                    <td>{e.data}</td>
                    <td>{e.fotos}</td>
                    <td><button onClick={() => deleteEvent(e.id)} aria-label="Remover"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === "fotos" && (
          <>
            <h1 className="admin__title">Fotos</h1>
            <AdminPhotoManager
              photos={store.photos}
              events={store.events}
              defaultPreco={store.settings.precoFoto}
              onRefresh={load}
              onMsg={setMsg}
            />
          </>
        )}

        {tab === "config" && (
          <>
            <h1 className="admin__title">Configurações</h1>
            <AdminFaceIndex photos={store.photos} onDone={setMsg} />
            <form className="form" style={{ maxWidth: 480, marginTop: 32 }} onSubmit={(e) => { e.preventDefault(); saveSettings(); }}>
              <label>Preço — foto digital<input type="number" step="0.01" value={store.settings.precoFoto} onChange={(e) => setStore({ ...store, settings: { ...store.settings, precoFoto: Number(e.target.value) } })} /></label>
              <label>Preço — pacote 5 fotos<input type="number" step="0.01" value={store.settings.precoPacote5} onChange={(e) => setStore({ ...store, settings: { ...store.settings, precoPacote5: Number(e.target.value) } })} /></label>
              <label>Preço — pacote completo<input type="number" step="0.01" value={store.settings.precoPacoteCompleto} onChange={(e) => setStore({ ...store, settings: { ...store.settings, precoPacoteCompleto: Number(e.target.value) } })} /></label>
              <label>Venda ativa (requer Mercado Pago)
                <select value={store.settings.pagamentoAtivo ? "sim" : "nao"} onChange={(e) => setStore({ ...store, settings: { ...store.settings, pagamentoAtivo: e.target.value === "sim" } })}>
                  <option value="sim">Sim</option>
                  <option value="nao">Não — demonstração</option>
                </select>
              </label>
              <p className="form__note">{payment?.aviso}</p>
              <button className="btn btn--primary" type="submit">SALVAR</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
