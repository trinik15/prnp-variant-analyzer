import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildReportFromDb } from "@/lib/prion/report";

export const dynamic = "force-dynamic";

/**
 * GET /api/report
 * Markdown literature-frequency report over the stored corpus:
 *   | Variant | Mutation Type | Number of Mentions |
 *   ?format=md  → raw text/markdown download
 *   (default)   → JSON { meta, rows, markdown }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  try {
    const lastLog = await db.searchLog.findFirst({ orderBy: { createdAt: "desc" } });
    const report = await buildReportFromDb(lastLog?.term);

    if (format === "md") {
      return new NextResponse(report.markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="prnp_variant_report_${new Date()
            .toISOString()
            .slice(0, 10)}.md"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build report.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
