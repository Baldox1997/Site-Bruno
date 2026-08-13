"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, Loader2, ScanFace, AlertCircle } from "lucide-react";
import { extractDescriptorFromFile, loadFaceModels } from "@/lib/face-client";

type Props = {
  onResults: (photoIds: string[], meta?: { total: number; threshold: number }) => void;
};

type Phase = "idle" | "loading-models" | "searching" | "error";

export default function SelfieSearch({ onResults }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [indexStatus, setIndexStatus] = useState<{ indexedPhotos: number } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadIndexStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/search/selfie");
      if (res.ok) setIndexStatus(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => { loadIndexStatus(); }, [loadIndexStatus]);

  async function searchWithFile(file: File) {
    setError("");
    setPhase("loading-models");
    try {
      await loadFaceModels();
      setPhase("searching");
      const descriptor = await extractDescriptorFromFile(file);
      const res = await fetch("/api/search/selfie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na busca");

      const ids = (data.matches ?? []).map((m: { photoId: string }) => m.photoId);
      if (ids.length === 0) {
        setError("Nenhuma foto sua encontrada. Tente outra selfie ou verifique se o evento já foi indexado.");
        setPhase("idle");
        return;
      }
      onResults(ids, { total: data.total, threshold: data.threshold });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao processar selfie");
      setPhase("idle");
    }
  }

  function handleFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    searchWithFile(file);
  }

  async function openCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
    } catch {
      setError("Não foi possível acessar a câmera. Envie uma foto da galeria.");
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function captureFromCamera() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    closeCamera();
    setPreview(canvas.toDataURL("image/jpeg", 0.92));

    canvas.toBlob(
      (blob) => {
        if (blob) searchWithFile(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  const busy = phase === "loading-models" || phase === "searching";

  return (
    <div className="selfiesearch">
      <div className="selfiesearch__steps-bar" aria-hidden>
        <span className="is-active">1. Selfie</span>
        <span>2. IA analisa</span>
        <span>3. Suas fotos</span>
      </div>

      {indexStatus && (
        <p className="selfiesearch__status">
          <ScanFace size={14} />
          {indexStatus.indexedPhotos > 0
            ? `${indexStatus.indexedPhotos} foto(s) indexada(s) para busca facial`
            : "Aguardando indexação das fotos do evento"}
        </p>
      )}

      {preview && !cameraOpen && (
        <div className="selfiesearch__preview">
          <img src={preview} alt="Sua selfie" />
          {busy && (
            <div className="selfiesearch__overlay">
              <Loader2 size={32} className="selfiesearch__spin" />
              <span>{phase === "loading-models" ? "Carregando IA…" : "Analisando rosto…"}</span>
            </div>
          )}
        </div>
      )}

      {cameraOpen && (
        <div className="selfiesearch__camera">
          <video ref={videoRef} playsInline muted />
          <canvas ref={canvasRef} hidden />
          <div className="selfiesearch__camera-actions">
            <button type="button" className="btn btn--primary" onClick={captureFromCamera}>
              <Camera size={16} /> Capturar
            </button>
            <button type="button" className="btn btn--ghost" onClick={closeCamera}>Cancelar</button>
          </div>
        </div>
      )}

      {!preview && !cameraOpen && (
        <div className="selfiesearch__actions">
          <button
            type="button"
            className="selfiesearch__card"
            onClick={openCamera}
            disabled={busy}
          >
            <Camera size={28} strokeWidth={1.3} />
            <strong>Tirar selfie</strong>
            <span>Use a câmera do celular ou webcam</span>
          </button>
          <button
            type="button"
            className="selfiesearch__card"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <Upload size={28} strokeWidth={1.3} />
            <strong>Enviar foto</strong>
            <span>Escolha uma selfie da galeria</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="user"
            hidden
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {error && (
        <div className="selfiesearch__error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!busy && preview && !cameraOpen && (
        <button
          type="button"
          className="btn btn--ghost btn--sm selfiesearch__retry"
          onClick={() => { setPreview(null); setError(""); setPhase("idle"); }}
        >
          Tentar outra selfie
        </button>
      )}

      <p className="selfiesearch__privacy">
        Sua selfie é processada no navegador e não é armazenada. Apenas o vetor facial anônimo é usado para comparar com as fotos do evento.
      </p>
    </div>
  );
}
