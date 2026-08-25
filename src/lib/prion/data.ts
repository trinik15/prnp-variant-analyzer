/** Server-side data access + CSV builders for the analyzer. */

import { db } from "@/lib/db";
import type { PaperDTO, StatsDTO, VariantDTO } from "./types";
import { computeStats } from "./types";

export async function loadVariantsFromDb(): Promise<VariantDTO[]> {
  const rows = await db.variant.findMany({
    include: { papers: { select: { pmid: true } } },
    orderBy: { notation: "asc" },
  });
  return rows
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
}

export async function loadPapersFromDb(): Promise<PaperDTO[]> {
  const rows = await db.paper.findMany({
    include: { variants: { select: { notation: true } } },
    orderBy: [{ pubYear: "desc" }, { pmid: "desc" }],
  });
  return rows.map((r) => ({
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
}

export async function loadLastSearch(): Promise<StatsDTO["lastSearch"]> {
  const last = await db.searchLog.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return last
    ? {
        term: last.term,
        createdAt: last.createdAt.toISOString(),
        papersFound: last.papersFound,
      }
    : null;
}

export async function loadAllStats(): Promise<StatsDTO> {
  const [variants, papers, lastSearch] = await Promise.all([
    loadVariantsFromDb(),
    loadPapersFromDb(),
    loadLastSearch(),
  ]);
  return computeStats(papers, variants, lastSearch);
}

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildVariantsCsv(variants: VariantDTO[]): string {
  const header = [
    "notation",
    "position",
    "from_aa",
    "to_aa",
    "variant_type",
    "classification",
    "disease_association",
    "pubmed_paper_count",
    "pubmed_pmids",
    "description",
  ].join(",");
  const lines = variants.map((v) =>
    [
      csvEscape(v.notation),
      csvEscape(v.position),
      csvEscape(v.fromAA),
      csvEscape(v.toAA),
      csvEscape(v.variantType),
      csvEscape(v.classification),
      csvEscape(v.disease),
      csvEscape(v.paperCount),
      csvEscape(v.pmids.join(" ")),
      csvEscape(v.description),
    ].join(","),
  );
  return [header, ...lines].join("\r\n");
}

export function buildPapersCsv(papers: PaperDTO[]): string {
  const header = [
    "pmid",
    "pub_year",
    "journal",
    "title",
    "authors",
    "doi",
    "prnp_variants_detected",
    "pubmed_url",
  ].join(",");
  const lines = papers.map((p) =>
    [
      csvEscape(p.pmid),
      csvEscape(p.pubYear ?? ""),
      csvEscape(p.journal),
      csvEscape(p.title),
      csvEscape(p.authors),
      csvEscape(p.doi),
      csvEscape(p.variants.join(" ")),
      csvEscape(`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`),
    ].join(","),
  );
  return [header, ...lines].join("\r\n");
}
