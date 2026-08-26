import { NextRequest, NextResponse } from "next/server";
import { loadPapersFromDb } from "@/lib/prion/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase();
    let papers = await loadPapersFromDb();
    if (q) {
      papers = papers.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.journal.toLowerCase().includes(q) ||
          p.authors.toLowerCase().includes(q) ||
          p.pmid.includes(q) ||
          p.variants.some((v) => v.toLowerCase().includes(q)),
      );
    }
    return NextResponse.json({ ok: true, papers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load papers.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
