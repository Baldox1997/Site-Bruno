"use client";

/** Client-only face recognition helpers. face-api is loaded dynamically to avoid SSR issues. */

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

async function getFaceApi() {
  return import("@vladmandic/face-api");
}

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const faceapi = await getFaceApi();
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  return loadingPromise;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem"));
    img.src = src;
  });
}

function descriptorToArray(desc: Float32Array): number[] {
  return Array.from(desc);
}

/** Detect the largest/most confident face and return its 128-dim descriptor. */
export async function extractFaceDescriptor(source: HTMLImageElement | HTMLCanvasElement): Promise<number[]> {
  const faceapi = await getFaceApi();
  await loadFaceModels();

  const detections = await faceapi
    .detectAllFaces(source, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length === 0) {
    throw new Error("Nenhum rosto detectado. Use uma foto nítida, de frente, com boa iluminação.");
  }

  const best = detections.reduce((a, b) =>
    (a.detection.score >= b.detection.score ? a : b),
  );

  return descriptorToArray(best.descriptor);
}

/** Extract all face descriptors from an image URL (for indexing gallery photos). */
export async function extractDescriptorsFromUrl(url: string): Promise<number[][]> {
  const faceapi = await getFaceApi();
  const img = await loadImageElement(url);
  await loadFaceModels();

  const detections = await faceapi
    .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections.map((d) => descriptorToArray(d.descriptor));
}

export async function extractDescriptorFromFile(file: File): Promise<number[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(url);
    return extractFaceDescriptor(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type PhotoToIndex = { id: string; img: string };

/** Index photos in batches and POST descriptors to the admin API. */
export async function indexPhotosBatch(
  photos: PhotoToIndex[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ indexed: number; skipped: number }> {
  const entries: { photoId: string; descriptors: number[][] }[] = [];
  let skipped = 0;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    try {
      const descriptors = await extractDescriptorsFromUrl(photo.img);
      if (descriptors.length > 0) {
        entries.push({ photoId: photo.id, descriptors });
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
    onProgress?.(i + 1, photos.length);
  }

  if (entries.length > 0) {
    const res = await fetch("/api/admin/face-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    if (!res.ok) throw new Error("Falha ao salvar índice facial");
  }

  return { indexed: entries.length, skipped };
}
