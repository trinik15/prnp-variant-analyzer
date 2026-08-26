import { NextResponse } from "next/server";
import { loadAllStats } from "@/lib/prion/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await loadAllStats();
    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load stats.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
