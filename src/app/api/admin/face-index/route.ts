import { NextResponse } from "next/server";
import { getFaceIndex, mergeFaceEntries, type FaceIndexEntry } from "@/lib/face-index";

export const maxDuration = 60;

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
  let body: { entries?: FaceIndexEntry[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { entries } = body;
  if (!entries || !Array.isArray(entries)) {
    return NextResponse.json({ error: "entries obrigatório" }, { status: 400 });
  }

  const valid = entries.filter(
    (e) => e.photoId && Array.isArray(e.descriptors) && e.descriptors.every((d) => Array.isArray(d) && d.length >= 64),
  );

  const index = await mergeFaceEntries(valid);
  const faces = index.entries.reduce((s, e) => s + e.descriptors.length, 0);

  return NextResponse.json({
    ok: true,
    added: valid.length,
    indexedPhotos: index.entries.length,
    indexedFaces: faces,
    updatedAt: index.updatedAt,
  });
}
