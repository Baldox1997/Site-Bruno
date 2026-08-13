import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  try {
    const store = await getStore();
    return NextResponse.json(store);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar dados";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
