import { promises as fs } from "fs";
import path from "path";
import { put, list } from "@vercel/blob";

export type FaceDescriptor = number[];

export type FaceIndexEntry = {
  photoId: string;
  descriptors: FaceDescriptor[];
};

export type FaceIndex = {
  version: 1;
  updatedAt: string;
  entries: FaceIndexEntry[];
};

const INDEX_KEY = "face-index.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "face-index.json");

function emptyIndex(): FaceIndex {
  return { version: 1, updatedAt: new Date().toISOString(), entries: [] };
}

async function readLocalIndex(): Promise<FaceIndex | null> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    return JSON.parse(raw) as FaceIndex;
  } catch {
    return null;
  }
}

async function writeLocalIndex(data: FaceIndex): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(data), "utf8");
}

async function readBlobIndex(): Promise<FaceIndex | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: INDEX_KEY, limit: 1 });
    const blob = blobs.find((b) => b.pathname === INDEX_KEY);
    if (!blob) return null;
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as FaceIndex;
  } catch {
    return null;
  }
}

async function writeBlobIndex(data: FaceIndex): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN required for production writes");
  }
  await put(INDEX_KEY, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getFaceIndex(): Promise<FaceIndex> {
  const blob = await readBlobIndex();
  if (blob) return blob;
  const local = await readLocalIndex();
  return local ?? emptyIndex();
}

export async function saveFaceIndex(data: FaceIndex): Promise<void> {
  data.updatedAt = new Date().toISOString();
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeBlobIndex(data);
    try {
      await writeLocalIndex(data);
    } catch {
      /* cache local opcional */
    }
    return;
  }
  await writeLocalIndex(data);
}

/** Merge new entries; replace existing photoId entries. */
export async function mergeFaceEntries(incoming: FaceIndexEntry[]): Promise<FaceIndex> {
  const index = await getFaceIndex();
  const map = new Map(index.entries.map((e) => [e.photoId, e]));
  for (const entry of incoming) {
    if (entry.descriptors.length > 0) {
      map.set(entry.photoId, entry);
    } else {
      map.delete(entry.photoId);
    }
  }
  index.entries = [...map.values()];
  await saveFaceIndex(index);
  return index;
}

export async function removePhotoFromIndex(photoId: string): Promise<void> {
  const index = await getFaceIndex();
  index.entries = index.entries.filter((e) => e.photoId !== photoId);
  await saveFaceIndex(index);
}
