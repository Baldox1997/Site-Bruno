"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, Trash2, Edit3 } from "lucide-react";
import type { Event, Photo } from "@/lib/types";

type Props = {
  photos: Photo[];
  events: Event[];
  defaultPreco: number;
  onRefresh: () => void;
  onMsg: (msg: string) => void;
};

export default function AdminPhotoManager({ photos, events, defaultPreco, onRefresh, onMsg }: Props) {
  const [filterEvent, setFilterEvent] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState(defaultPreco);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState(0);

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      if (filterEvent && p.eventoId !== filterEvent) return false;
      if (search && !p.evento.toLowerCase().includes(search.toLowerCase()) && !p.id.includes(search)) return false;
      return true;
    });
  }, [photos, filterEvent, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((p) => p.id)));
  }

  async function patchPhoto(id: string, patch: Partial<Photo>) {
    await fetch("/api/admin/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    onRefresh();
  }

  async function bulkUpdatePrice() {
    if (selected.size === 0) return;
    await fetch("/api/admin/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], preco: bulkPrice }),
    });
    onMsg(`${selected.size} foto(s) atualizada(s) para R$ ${bulkPrice.toFixed(2)}`);
    setSelected(new Set());
    onRefresh();
  }

  async function bulkTogglePublish(publicado: boolean) {
    for (const id of selected) {
      await fetch("/api/admin/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, publicado }),
      });
    }
    onMsg(`${selected.size} foto(s) ${publicado ? "publicadas" : "ocultadas"}`);
    setSelected(new Set());
    onRefresh();
  }

  async function removeSelected() {
    if (!confirm(`Remover ${selected.size} foto(s)?`)) return;
    for (const id of selected) {
      await fetch(`/api/admin/photos?id=${id}`, { method: "DELETE" });
    }
    onMsg(`${selected.size} foto(s) removida(s)`);
    setSelected(new Set());
    onRefresh();
  }

  return (
    <div className="photomgr">
      <div className="photomgr__toolbar">
        <input
          className="photomgr__search"
          placeholder="Buscar por evento ou ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)}>
          <option value="">Todos os eventos</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
        <button type="button" className="btn btn--ghost btn--sm" onClick={selectAll}>Selecionar visíveis</button>
        <span className="photomgr__count">{filtered.length} fotos · {selected.size} selecionada(s)</span>
      </div>

      {selected.size > 0 && (
        <div className="photomgr__bulk">
          <label>
            Preço em lote
            <input type="number" step="0.01" value={bulkPrice} onChange={(e) => setBulkPrice(Number(e.target.value))} />
          </label>
          <button type="button" className="btn btn--primary btn--sm" onClick={bulkUpdatePrice}>Aplicar preço</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => bulkTogglePublish(true)}><Eye size={14} /> Publicar</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => bulkTogglePublish(false)}><EyeOff size={14} /> Ocultar</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={removeSelected}><Trash2 size={14} /> Excluir</button>
        </div>
      )}

      <div className="adminphotogrid">
        {filtered.map((p) => (
          <div key={p.id} className={`adminphoto ${selected.has(p.id) ? "is-selected" : ""} ${p.publicado === false ? "is-hidden" : ""}`}>
            <button type="button" className="adminphoto__check" onClick={() => toggle(p.id)}>
              {selected.has(p.id) ? <Check size={14} /> : null}
            </button>
            <img src={p.img} alt="" draggable={false} />
            <div className="adminphoto__meta">
              {editingId === p.id ? (
                <div className="adminphoto__edit">
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    autoFocus
                  />
                  <button type="button" onClick={async () => {
                    await patchPhoto(p.id, { preco: editPrice });
                    setEditingId(null);
                    onMsg("Preço atualizado");
                  }}><Check size={12} /></button>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => { setEditingId(p.id); setEditPrice(p.preco); }}>
                    R$ {p.preco.toFixed(2)} <Edit3 size={10} />
                  </button>
                  <button type="button" onClick={() => patchPhoto(p.id, { publicado: p.publicado === false })} aria-label="Visibilidade">
                    {p.publicado === false ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button type="button" onClick={async () => {
                    if (!confirm("Remover?")) return;
                    await fetch(`/api/admin/photos?id=${p.id}`, { method: "DELETE" });
                    onRefresh();
                  }} aria-label="Remover"><Trash2 size={12} /></button>
                </>
              )}
            </div>
            <span className="adminphoto__event">{p.evento}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
