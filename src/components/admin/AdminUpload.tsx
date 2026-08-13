"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon, Plus, MapPin, ExternalLink, Send, FolderOpen } from "lucide-react";
import type { Event, Photo } from "@/lib/types";
import { indexPhotosBatch } from "@/lib/face-client";
import MaskedInput from "@/components/ui/MaskedInput";
import { parseCurrency } from "@/lib/input-masks";

const BATCH_SIZE = 8;
const CATEGORIES = ["Esportes", "Eventos", "Shows", "Ensaios", "Retratos", "Corporativo"];

type Props = {
  events: Event[];
  defaultPreco: number;
  onDone: (msg: string) => void;
  onEventsChange?: () => void;
  siteUrl?: string;
};

export default function AdminUpload({ events, defaultPreco, onDone, onEventsChange, siteUrl = "/" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [eventMode, setEventMode] = useState<"pick" | "new">(events.length ? "pick" : "new");
  const [eventoId, setEventoId] = useState(events[0]?.id ?? "");
  const [newEvent, setNewEvent] = useState({ nome: "", data: "", local: "", categoria: "Esportes" });
  const [precoStr, setPrecoStr] = useState(defaultPreco.toFixed(2).replace(".", ","));
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [indexProgress, setIndexProgress] = useState({ done: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);

  const preco = parseCurrency(precoStr) || defaultPreco;
  const selectedEvent = events.find((e) => e.id === eventoId);

  const addFiles = useCallback((list: FileList | File[]) => {
    const incoming = [...list].filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...incoming.filter((f) => !names.has(f.name + f.size))];
    });
    if (incoming.length) setStep(2);
  }, []);

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function resolveEventId(): Promise<string> {
    if (eventMode === "pick") {
      if (!eventoId) throw new Error("Escolha um evento");
      return eventoId;
    }
    if (!newEvent.nome.trim() || !newEvent.data || !newEvent.local.trim()) {
      throw new Error("Preencha nome, data e local");
    }
    setCreatingEvent(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar evento");
      setEventoId(data.event.id);
      setEventMode("pick");
      onEventsChange?.();
      return data.event.id;
    } finally {
      setCreatingEvent(false);
    }
  }

  async function uploadBatch(batch: File[], evId: string) {
    const fd = new FormData();
    fd.set("eventoId", evId);
    fd.set("preco", String(preco));
    batch.forEach((f) => fd.append("files", f));
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Falha no lote");
    return res.json();
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    let uploaded = 0;
    const allAdded: Photo[] = [];

    try {
      const evId = await resolveEventId();
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const result = await uploadBatch(batch, evId);
        if (result.added) allAdded.push(...result.added);
        uploaded += batch.length;
        setProgress({ done: uploaded, total: files.length });
      }
      setFiles([]);
      setStep(1);

      let msg = `${uploaded} foto(s) publicada(s) com sucesso`;
      if (allAdded.length > 0) {
        setIndexing(true);
        setIndexProgress({ done: 0, total: allAdded.length });
        try {
          const { indexed } = await indexPhotosBatch(
            allAdded.map((p) => ({ id: p.id, img: p.img })),
            (done, total) => setIndexProgress({ done, total }),
          );
          msg += ` · IA: ${indexed} rosto(s)`;
        } catch {
          msg += " · IA pendente";
        } finally {
          setIndexing(false);
          setIndexProgress({ done: 0, total: 0 });
        }
      }
      onDone(msg);
    } catch (e) {
      onDone(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const canPublish = files.length > 0 && (eventMode === "pick" ? !!eventoId : newEvent.nome && newEvent.data && newEvent.local);

  return (
    <div className="workflow">
      <div className="workflow__steps" role="tablist" aria-label="Etapas de publicação">
        {[
          { n: 1, label: "Evento" },
          { n: 2, label: "Fotos" },
          { n: 3, label: "Publicar" },
        ].map(({ n, label }) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={step === n}
            aria-label={`Etapa ${n}: ${label}`}
            className={`workflow__step ${step === n ? "is-active" : ""} ${step > n ? "is-done" : ""}`}
            onClick={() => setStep(n as 1 | 2 | 3)}
          >
            <span>{n}</span>
            {label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="workflow__panel">
          <div className="workflow__modes">
            <button type="button" className={eventMode === "pick" ? "is-active" : ""} onClick={() => setEventMode("pick")}>
              <FolderOpen size={16} /> Existente
            </button>
            <button type="button" className={eventMode === "new" ? "is-active" : ""} onClick={() => setEventMode("new")}>
              <Plus size={16} /> Novo evento
            </button>
          </div>

          {eventMode === "pick" ? (
            <div className="eventpick">
              {events.length === 0 ? (
                <p className="workflow__hint">Nenhum evento — crie um em <strong>Novo evento</strong></p>
              ) : (
                events.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    className={`eventpick__card ${eventoId === ev.id ? "is-selected" : ""}`}
                    onClick={() => { setEventoId(ev.id); setStep(2); }}
                  >
                    <img src={ev.capa} alt="" />
                    <div>
                      <strong>{ev.nome}</strong>
                      <span>{ev.data} · {ev.fotos} fotos</span>
                    </div>
                    {eventoId === ev.id && <span className="eventpick__badge">✓</span>}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="eventnew form">
              <label>Nome
                <input value={newEvent.nome} onChange={(e) => setNewEvent({ ...newEvent, nome: e.target.value })} placeholder="Maratona 2026" />
              </label>
              <div className="form__grid">
                <label>Data
                  <MaskedInput mask="date" value={newEvent.data} onChange={(v) => setNewEvent({ ...newEvent, data: v })} />
                </label>
                <label>Categoria
                  <select value={newEvent.categoria} onChange={(e) => setNewEvent({ ...newEvent, categoria: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <label>Local
                <input value={newEvent.local} onChange={(e) => setNewEvent({ ...newEvent, local: e.target.value })} placeholder="Curitiba, PR" />
              </label>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStep(2)} disabled={!newEvent.nome || !newEvent.data || !newEvent.local}>
                Próximo → Fotos
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="workflow__panel">
          {(selectedEvent || eventMode === "new") && (
            <p className="workflow__target">
              <MapPin size={14} aria-hidden /> {eventMode === "new" ? newEvent.nome || "Novo evento" : selectedEvent?.nome}
            </p>
          )}
          <div
            className={`uploadzone__drop ${dragOver ? "is-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
            role="button"
            tabIndex={0}
            aria-label="Selecionar ou soltar fotos para upload"
          >
            <Upload size={32} strokeWidth={1.2} />
            <strong>Soltar fotos aqui</strong>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>
          {files.length > 0 && (
            <div className="uploadzone__queue">
              <span><ImageIcon size={14} /> {files.length} selecionada(s)</span>
              <button type="button" className="btn btn--primary btn--sm" onClick={() => setStep(3)}>Continuar →</button>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="workflow__panel">
          <div className="workflow__summary">
            <span>{files.length} foto(s)</span>
            <span>{eventMode === "new" ? newEvent.nome : selectedEvent?.nome}</span>
          </div>
          <label className="workflow__price">
            Preço (R$)
            <MaskedInput mask="currency" value={precoStr} onChange={setPrecoStr} />
          </label>
          {uploading && (
            <div className="uploadzone__progress">
              <div className="uploadzone__bar" style={{ width: `${pct}%` }} />
              <span>{pct}%</span>
            </div>
          )}
          {indexing && (
            <div className="uploadzone__progress uploadzone__progress--index">
              <div className="uploadzone__bar" style={{ width: `${indexProgress.total ? Math.round((indexProgress.done / indexProgress.total) * 100) : 0}%` }} />
              <span>IA {indexProgress.done}/{indexProgress.total}</span>
            </div>
          )}
          <div className="workflow__actions">
            <button
              className="btn btn--primary"
              type="button"
              disabled={uploading || indexing || creatingEvent || !canPublish}
              onClick={handleUpload}
              aria-label={uploading ? `Publicando fotos, ${pct}% concluído` : `Publicar ${files.length} foto(s)`}
            >
              <Send size={16} aria-hidden /> {uploading ? `Publicando ${pct}%…` : `PUBLICAR ${files.length} FOTO(S)`}
            </button>
            <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--sm">
              <ExternalLink size={14} /> Ver no site
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
