import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  try {
    const store = await getStore();
    return NextResponse.json(store);
  } catch (err) {
    console.error("[admin/store]", err);
    return NextResponse.json({ error: "Erro ao carregar dados" }, { status: 500 });
  }
}
