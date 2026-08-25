/** Shared DTO types between API routes and the frontend. */

export interface VariantDTO {
  notation: string;
  fromAA: string;
  toAA: string;
  position: number;
  variantType: string;
  classification: string;
  disease: string;
  description: string;
  paperCount: number;
  pmids: string[];
}

export interface PaperDTO {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pubYear: number | null;
  doi: string;
  keywords: string;
  abstract: string;
  variants: string[];
}

export interface StatsDTO {
  totalPapers: number;
  totalVariants: number;
  pathogenicCount: number;
  unclassifiedCount: number;
  yearsCovered: string;
  papersByYear: { year: string; count: number }[];
  topVariants: { notation: string; count: number; classification: string }[];
  classificationBreakdown: { name: string; value: number }[];
  lastSearch: { term: string; createdAt: string; papersFound: number } | null;
}

export interface AnalyzeResponse {
  ok: true;
  search: {
    term: string;
    retmax: number;
    totalOnPubmed: number;
    fetched: number;
    queryTranslation: string;
  };
  papers: PaperDTO[];
  variants: VariantDTO[];
  stats: StatsDTO;
}

export function computeStats(
  papers: PaperDTO[],
  variants: VariantDTO[],
  lastSearch?: StatsDTO["lastSearch"],
): StatsDTO {
  const byYear = new Map<number, number>();
  for (const p of papers) {
    if (p.pubYear) {
      byYear.set(p.pubYear, (byYear.get(p.pubYear) ?? 0) + 1);
    }
  }
  const papersByYear = Array.from(byYear.entries())
    .map(([year, count]) => ({ year: String(year), count }))
    .sort((a, b) => a.year.localeCompare(b.year));

  const topVariants = [...variants]
    .sort((a, b) => b.paperCount - a.paperCount)
    .slice(0, 12)
    .map((v) => ({
      notation: v.notation,
      count: v.paperCount,
      classification: v.classification,
    }));

  const classMap = new Map<string, number>();
  for (const v of variants) {
    classMap.set(v.classification, (classMap.get(v.classification) ?? 0) + 1);
  }
  const classificationBreakdown = Array.from(classMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const years = papersByYear.map((y) => y.year);

  return {
    totalPapers: papers.length,
    totalVariants: variants.length,
    pathogenicCount: variants.filter((v) => v.classification === "Pathogenic").length,
    unclassifiedCount: variants.filter((v) => v.classification === "Unclassified").length,
    yearsCovered: years.length ? `${years[0]}-${years[years.length - 1]}` : "unknown",
    papersByYear,
    topVariants,
    classificationBreakdown,
    lastSearch: lastSearch ?? null,
  };
}
