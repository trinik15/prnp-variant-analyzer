import { NextRequest, NextResponse } from "next/server";
import { buildPapersCsv, buildVariantsCsv, loadPapersFromDb, loadVariantsFromDb } from "@/lib/prion/data";

export const dynamic = "force-dynamic";

/**
 * CSV export endpoint — the deliverable the community asked for:
 * a clean, machine-readable map of PRNP variants harvested from PubMed.
 *
 *   /api/export?type=variants  → variants.csv
 *   /api/export?type=papers    → papers.csv
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "variants";

  try {
    let csv: string;
    let filename: string;

    if (type === "papers") {
      const papers = await loadPapersFromDb();
      csv = buildPapersCsv(papers);
      filename = `prnp_papers_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      const variants = await loadVariantsFromDb();
      csv = buildVariantsCsv(variants);
      filename = `prnp_variants_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
