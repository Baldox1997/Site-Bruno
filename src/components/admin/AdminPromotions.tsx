"use client";

import { useState } from "react";
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import type { Promotion } from "@/lib/types";
import { isPromotionActive } from "@/lib/promotions";

type Props = {
  promotions: Promotion[];
  onRefresh: () => void;
  onMsg: (msg: string) => void;
};

export default function AdminPromotions({ promotions, onRefresh, onMsg }: Props) {
  const [showForm, setShowForm] = useState(false);

  async function createPromo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: fd.get("codigo"),
        titulo: fd.get("titulo"),
        descricao: fd.get("descricao"),
        tipo: fd.get("tipo"),
        valor: Number(fd.get("valor")),
        minFotos: fd.get("minFotos") ? Number(fd.get("minFotos")) : undefined,
        inicio: fd.get("inicio"),
        fim: fd.get("fim"),
        ativa: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onMsg(data.error || "Erro ao criar promoção");
      return;
    }
    (e.target as HTMLFormElement).reset();
    setShowForm(false);
    onMsg("Promoção criada e disponível no site.");
    onRefresh();
  }

  async function toggleActive(p: Promotion) {
    await fetch("/api/admin/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, ativa: !p.ativa }),
    });
    onRefresh();
  }

  async function remove(id: string) {
    if (!confirm("Remover esta promoção?")) return;
    await fetch(`/api/admin/promotions?id=${id}`, { method: "DELETE" });
    onMsg("Promoção removida.");
    onRefresh();
  }

  return (
    <div className="promosection">
      <div className="admin__head">
        <p className="page__lead" style={{ margin: 0 }}>Crie cupons e promoções visíveis no site e no checkout.</p>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> NOVA PROMOÇÃO
        </button>
      </div>

      {showForm && (
        <form className="form promocard" onSubmit={createPromo}>
          <div className="form__grid">
            <label>Código do cupom<input name="codigo" required placeholder="BZ10" style={{ textTransform: "uppercase" }} /></label>
            <label>Título<input name="titulo" required placeholder="10% off" /></label>
          </div>
          <label>Descrição (aparece no site)<textarea name="descricao" rows={2} placeholder="Válido para 2+ fotos" /></label>
          <div className="form__grid">
            <label>Tipo
              <select name="tipo" defaultValue="percentual">
                <option value="percentual">Percentual (%)</option>
                <option value="fixo">Valor fixo (R$)</option>
              </select>
            </label>
            <label>Valor<input name="valor" type="number" step="0.01" required placeholder="10" /></label>
            <label>Mín. fotos<input name="minFotos" type="number" min={0} placeholder="Opcional" /></label>
          </div>
          <div className="form__grid">
            <label>Início<input name="inicio" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
            <label>Fim<input name="fim" type="date" required defaultValue="2026-12-31" /></label>
          </div>
          <button className="btn btn--primary btn--sm" type="submit">SALVAR PROMOÇÃO</button>
        </form>
      )}

      <div className="promogrid">
        {promotions.length === 0 && (
          <p className="form__note">Nenhuma promoção cadastrada. Clique em &quot;Nova promoção&quot; para começar.</p>
        )}
        {promotions.map((p) => {
          const active = isPromotionActive(p);
          return (
            <div key={p.id} className={`promocard ${active ? "is-live" : ""}`}>
              <div className="promocard__head">
                <Tag size={14} />
                <strong>{p.codigo}</strong>
                <span className={`promocard__badge ${active ? "is-on" : ""}`}>
                  {active ? "Ativa" : "Inativa"}
                </span>
              </div>
              <h4>{p.titulo}</h4>
              <p>{p.descricao || "—"}</p>
              <p className="promocard__meta">
                {p.tipo === "percentual" ? `${p.valor}% off` : `R$ ${p.valor.toFixed(2)} off`}
                {p.minFotos ? ` · mín. ${p.minFotos} fotos` : ""}
                <br />
                {p.inicio} → {p.fim}
              </p>
              <div className="promocard__actions">
                <button type="button" onClick={() => toggleActive(p)} aria-label="Ativar/desativar">
                  {p.ativa ? <ToggleRight size={18} color="var(--accent2)" /> : <ToggleLeft size={18} />}
                </button>
                <button type="button" onClick={() => remove(p.id)} aria-label="Remover"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
