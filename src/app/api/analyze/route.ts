import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractVariants } from "@/lib/prion/extract";
import { pubmedFetch, pubmedSearch } from "@/lib/prion/pubmed";
import { computeStats, type AnalyzeResponse, type PaperDTO, type VariantDTO } from "@/lib/prion/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AnalyzeBody {
  term?: string;
  retmax?: number;
  mindate?: string;
  maxdate?: string;
}

export async function POST(req: NextRequest) {
  let body: AnalyzeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const term = (body.term ?? "").trim().slice(0, 400);
  if (!term) {
    return NextResponse.json(
      { ok: false, error: "A PubMed search term is required (e.g. 'PRNP mutation')." },
      { status: 400 },
    );
  }

  const retmax = Math.min(200, Math.max(10, Number(body.retmax) || 60));
  const mindate = (body.mindate ?? "").trim().slice(0, 4);
  const maxdate = (body.maxdate ?? "").trim().slice(0, 4);

  try {
    // 1. esearch -> PMIDs
    const search = await pubmedSearch(term, retmax, mindate || undefined, maxdate || undefined);

    // 2. efetch -> full records
    const fetched = await pubmedFetch(search.ids);

    // 3. Persist papers + extract & persist variants (many-to-many)
    const paperDtos: PaperDTO[] = [];

    for (const paper of fetched) {
      const extracted = extractVariants(`${paper.title}. ${paper.abstract}`);

      const row = await db.paper.upsert({
        where: { pmid: paper.pmid },
        update: {
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          pubYear: paper.pubYear,
          abstract: paper.abstract,
          doi: paper.doi,
          keywords: paper.keywords,
        },
        create: {
          pmid: paper.pmid,
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          pubYear: paper.pubYear,
          abstract: paper.abstract,
          doi: paper.doi,
          keywords: paper.keywords,
        },
      });

      const notations: string[] = [];
      for (const ev of extracted) {
        const variant = await db.variant.upsert({
          where: { notation: ev.notation },
          update: {
            classification: ev.info.classification,
            disease: ev.info.disease,
            description: ev.info.description,
            variantType: ev.variantType,
          },
          create: {
            notation: ev.notation,
            fromAA: ev.fromAA,
            toAA: ev.toAA,
            position: ev.position,
            variantType: ev.variantType,
            classification: ev.info.classification,
            disease: ev.info.disease,
            description: ev.info.description,
          },
        });

        // connect is idempotent — safe on repeat analyses
        await db.paper.update({
          where: { id: row.id },
          data: { variants: { connect: { id: variant.id } } },
        });
        notations.push(ev.notation);
      }

      paperDtos.push({
        pmid: paper.pmid,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        pubYear: paper.pubYear,
        doi: paper.doi,
        keywords: paper.keywords,
        abstract: paper.abstract,
        variants: notations,
      });
    }

    await db.searchLog.create({
      data: {
        term,
        retmax,
        papersFound: fetched.length,
        variantsFound: paperDtos.reduce((acc, p) => acc + p.variants.length, 0),
      },
    });

    // 4. Re-read the full corpus from DB so the response reflects everything known
    const dbPapers = await db.paper.findMany({
      include: { variants: { select: { notation: true } } },
      orderBy: [{ pubYear: "desc" }, { pmid: "desc" }],
    });
    const dbVariants = await db.variant.findMany({
      include: { papers: { select: { pmid: true } } },
    });

    const papers: PaperDTO[] = dbPapers.map((r) => ({
      pmid: r.pmid,
      title: r.title,
      authors: r.authors,
      journal: r.journal,
      pubYear: r.pubYear,
      doi: r.doi,
      keywords: r.keywords,
      abstract: r.abstract,
      variants: r.variants.map((v) => v.notation),
    }));

    const variants: VariantDTO[] = dbVariants
      .map((r) => ({
        notation: r.notation,
        fromAA: r.fromAA,
        toAA: r.toAA,
        position: r.position,
        variantType: r.variantType,
        classification: r.classification,
        disease: r.disease,
        description: r.description,
        paperCount: r.papers.length,
        pmids: r.papers.map((p) => p.pmid),
      }))
      .sort((a, b) => b.paperCount - a.paperCount || a.position - b.position);

    const lastLog = await db.searchLog.findFirst({ orderBy: { createdAt: "desc" } });

    const payload: AnalyzeResponse = {
      ok: true,
      search: {
        term,
        retmax,
        totalOnPubmed: search.total,
        fetched: fetched.length,
        queryTranslation: search.queryTranslation,
      },
      papers,
      variants,
      stats: computeStats(
        papers,
        variants,
        lastLog
          ? {
              term: lastLog.term,
              createdAt: lastLog.createdAt.toISOString(),
              papersFound: lastLog.papersFound,
            }
          : undefined,
      ),
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during analysis.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
