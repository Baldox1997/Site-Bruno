import { promises as fs } from "fs";
import path from "path";
import { put, list } from "@vercel/blob";
import type { StoreData } from "./types";
import { defaultStore } from "./seed";
import { normalizeStore } from "./orders";

const STORE_KEY = "store.json";
const LOCAL_PATH = path.join(process.cwd(), "data", "store.json");

async function readLocalStore(): Promise<StoreData | null> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    return JSON.parse(raw) as StoreData;
  } catch {
    return null;
  }
}

async function writeLocalStore(data: StoreData): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify(data, null, 2), "utf8");
}

async function readBlobStore(): Promise<StoreData | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: STORE_KEY, limit: 1 });
    const blob = blobs.find((b) => b.pathname === STORE_KEY);
    if (!blob) return null;
    const res = await fetch(blob.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as StoreData;
  } catch {
    return null;
  }
}

async function writeBlobStore(data: StoreData): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN required for production writes");
  }
  await put(STORE_KEY, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getStore(): Promise<StoreData> {
  const blob = await readBlobStore();
  if (blob) return normalizeStore(blob);
  const local = await readLocalStore();
  if (local) return normalizeStore(local);
  const seed = defaultStore();
  try {
    await saveStore(seed);
  } catch {
    /* Vercel sem Blob: retorna seed em memória para o painel carregar */
  }
  return seed;
}

export async function saveStore(data: StoreData): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeBlobStore(data);
    try {
      await writeLocalStore(data);
    } catch {
      /* cache local opcional */
    }
    return;
  }
  await writeLocalStore(data);
}

export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const name = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, file, { access: "public", addRandomSuffix: false });
    return blob.url;
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const localName = name.replace("/", "-");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, localName);
  await fs.writeFile(filePath, buf);
  return `/uploads/${localName}`;
}
