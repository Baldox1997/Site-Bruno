"use client";

import { useContent } from "./content-context";
import { calcPublicWorkflow, workflowProgress } from "@/lib/workflow";
import { CheckCircle2, ScanFace } from "lucide-react";

type Props = {
  cartCount: number;
  selfieDone?: boolean;
  photosFound?: number;
  setView: (v: string) => void;
};

export default function PublicGuideBar({
  cartCount,
  selfieDone,
  photosFound = 0,
  setView,
}: Props) {
  const { photos, events, loading } = useContent();
  if (loading) return null;

  const steps = calcPublicWorkflow({ selfieDone, cartCount, photosFound });
  const doneCount = steps.filter((s) => s.done).length;
  const progress = workflowProgress(steps);

  return (
    <nav className="siteguide" aria-label="Seu progresso na plataforma">
      <div className="siteguide__live">
        <span className="siteguide__pulse" aria-hidden />
        <strong>{photos.length}</strong> fotos · <strong>{events.length}</strong> eventos
      </div>

      <ol
        className="siteguide__steps"
        aria-label={`${doneCount} de ${steps.length} etapas concluídas`}
      >
        {steps.map((s) => (
          <li key={s.id} className={`siteguide__step ${s.done ? "is-done" : ""}`}>
            {s.done ? (
              <CheckCircle2 size={12} aria-hidden />
            ) : (
              <span className="siteguide__dot" aria-hidden />
            )}
            {s.label}
          </li>
        ))}
      </ol>

      <div
        className="siteguide__progress"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso do fluxo"
      >
        <div className="siteguide__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {!selfieDone && (
        <button
          type="button"
          className="siteguide__cta"
          onClick={() => setView("busca")}
          aria-label="Buscar fotos com reconhecimento facial"
        >
          <ScanFace size={14} aria-hidden /> Selfie IA
        </button>
      )}
    </nav>
  );
}
