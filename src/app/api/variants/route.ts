import { NextRequest, NextResponse } from "next/server";
import { loadVariantsFromDb } from "@/lib/prion/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase();
    const classification = req.nextUrl.searchParams.get("classification") ?? "";
    let variants = await loadVariantsFromDb();

    if (classification && classification !== "All") {
      variants = variants.filter((v) => v.classification === classification);
    }
    if (q) {
      variants = variants.filter(
        (v) =>
          v.notation.toLowerCase().includes(q) ||
          v.disease.toLowerCase().includes(q) ||
          String(v.position) === q,
      );
    }
    return NextResponse.json({ ok: true, variants });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load variants.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
