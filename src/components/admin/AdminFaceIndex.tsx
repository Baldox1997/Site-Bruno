"use client";

import { useCallback, useEffect, useState } from "react";
import { ScanFace, Loader2, RefreshCw } from "lucide-react";
import { indexPhotosBatch } from "@/lib/face-client";
import type { Photo } from "@/lib/types";

type Props = {
  photos: Photo[];
  onDone: (msg: string) => void;
};

export default function AdminFaceIndex({ photos, onDone }: Props) {
  const [status, setStatus] = useState<{ indexedPhotos: number; indexedFaces: number; updatedAt?: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/admin/face-index");
    if (res.ok) setStatus(await res.json());
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  async function reindexAll() {
    if (!photos.length) {
      onDone("Nenhuma foto para indexar.");
      return;
    }
    if (!confirm(`Reindexar ${photos.length} foto(s) para busca por selfie? Pode levar alguns minutos.`)) return;

    setRunning(true);
    setProgress({ done: 0, total: photos.length });
    try {
      const batchSize = 5;
      let totalIndexed = 0;
      let totalSkipped = 0;

      for (let i = 0; i < photos.length; i += batchSize) {
        const batch = photos.slice(i, i + batchSize);
        const { indexed, skipped } = await indexPhotosBatch(
          batch.map((p) => ({ id: p.id, img: p.img })),
          (done, total) => setProgress({ done: i + done, total: photos.length }),
        );
        totalIndexed += indexed;
        totalSkipped += skipped;
      }

      await loadStatus();
      onDone(`Indexação concluída: ${totalIndexed} foto(s) com rosto${totalSkipped ? `, ${totalSkipped} sem rosto detectado` : ""}.`);
    } catch {
      onDone("Erro na indexação facial. Tente novamente.");
    } finally {
      setRunning(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="faceindex">
      <div className="faceindex__head">
        <ScanFace size={20} />
        <div>
          <strong>Busca por selfie (IA)</strong>
          <p className="form__note" style={{ margin: "4px 0 0" }}>
            Indexa rostos nas fotos para visitantes encontrarem suas imagens enviando uma selfie.
          </p>
        </div>
      </div>

      {status && (
        <div className="faceindex__stats">
          <span>{status.indexedPhotos} foto(s) indexada(s)</span>
          <span>{status.indexedFaces} rosto(s) detectado(s)</span>
          {status.updatedAt && (
            <span className="faceindex__updated">
              Atualizado: {new Date(status.updatedAt).toLocaleString("pt-BR")}
            </span>
          )}
        </div>
      )}

      {running && (
        <div className="uploadzone__progress uploadzone__progress--index">
          <div className="uploadzone__bar" style={{ width: `${pct}%` }} />
          <span>{progress.done} / {progress.total} ({pct}%)</span>
        </div>
      )}

      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={reindexAll}
        disabled={running || photos.length === 0}
      >
        {running ? <Loader2 size={14} className="selfiesearch__spin" /> : <RefreshCw size={14} />}
        {running ? "Indexando…" : "Reindexar todas as fotos"}
      </button>
    </div>
  );
}
