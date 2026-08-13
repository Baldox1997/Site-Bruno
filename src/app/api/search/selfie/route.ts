import { NextResponse } from "next/server";
import { getFaceIndex } from "@/lib/face-index";
import { findMatches, DEFAULT_MATCH_THRESHOLD } from "@/lib/face-similarity";
import { getStore } from "@/lib/store";

export const maxDuration = 30;

export async function GET() {
  const index = await getFaceIndex();
  const faces = index.entries.reduce((s, e) => s + e.descriptors.length, 0);
  return NextResponse.json({
    indexedPhotos: index.entries.length,
    indexedFaces: faces,
    updatedAt: index.updatedAt,
  });
}

export async function POST(req: Request) {
  let body: { descriptor?: number[]; threshold?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { descriptor, threshold = DEFAULT_MATCH_THRESHOLD } = body;
  if (!descriptor || !Array.isArray(descriptor) || descriptor.length < 64) {
    return NextResponse.json({ error: "Descriptor facial inválido" }, { status: 400 });
  }

  const index = await getFaceIndex();
  if (index.entries.length === 0) {
    return NextResponse.json({
      matches: [],
      message: "Índice facial vazio. As fotos ainda estão sendo indexadas.",
    });
  }

  const rawMatches = findMatches(descriptor, index.entries, threshold);
  const store = await getStore();
  const publishedIds = new Set(
    store.photos.filter((p) => p.publicado !== false).map((p) => p.id),
  );

  const matches = rawMatches
    .filter((m) => publishedIds.has(m.photoId))
    .map((m) => ({
      photoId: m.photoId,
      score: Math.round(m.score * 1000) / 1000,
    }));

  return NextResponse.json({
    matches,
    total: matches.length,
    threshold,
  });
}
