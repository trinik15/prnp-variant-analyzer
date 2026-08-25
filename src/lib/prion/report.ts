/**
 * Markdown literature-frequency report builder.
 *
 * Mirrors public/scripts/prnp_pubmed_variants.py — same table semantics:
 *   | Variant | Mutation Type | Number of Mentions |
 * Mentions = total textual occurrences across stored titles + abstracts.
 */

import { db } from "@/lib/db";
import { countVariantMentions, mutationTypeLabel } from "./extract";

export interface ReportRow {
  notation: string;
  mutationType: string;
  mentions: number;
  papers: number;
  classification: string;
  disease: string;
}

export interface ReportData {
  meta: {
    papers: number;
    variants: number;
    totalMentions: number;
    yearFrom: number | null;
    yearTo: number | null;
    generatedAt: string;
    source: string;
  };
  rows: ReportRow[];
  markdown: string;
}

export function buildMarkdown(
  rows: ReportRow[],
  meta: ReportData["meta"],
  term?: string,
): string {
  const lines: string[] = [];
  lines.push("# PRNP Variant Literature Frequency Report");
  lines.push("");
  lines.push(`**Papers analysed:** ${meta.papers} (peer-reviewed, PubMed)  `);
  if (meta.yearFrom && meta.yearTo) {
    lines.push(`**Publication window:** ${meta.yearFrom} - ${meta.yearTo}  `);
  }
  if (term) lines.push(`**Latest query:** \`${term}\`  `);
  lines.push(`**Generated:** ${meta.generatedAt}  `);
  lines.push(`**Source:** ${meta.source}`);
  lines.push("");
  lines.push("| Variant | Mutation Type | Number of Mentions |");
  lines.push("|---------|---------------|--------------------|");
  for (const r of rows) {
    lines.push(`| ${r.notation} | ${r.mutationType} | ${r.mentions} |`);
  }
  lines.push("");
  lines.push(
    "*Mentions = total textual occurrences across titles and abstracts of the analysed corpus. Structural events (OPRI/OPRD) are counted once per paper discussing them. Always validate novel candidates against ClinVar.*",
  );
  lines.push("");
  return lines.join("\n");
}

export async function buildReportFromDb(lastTerm?: string): Promise<ReportData> {
  const papers = await db.paper.findMany({
    include: { variants: { select: { notation: true, variantType: true, classification: true, disease: true } } },
  });

  // 1. textual mentions across the whole corpus
  const mentionTotals = new Map<string, number>();
  for (const p of papers) {
    const counts = countVariantMentions(`${p.title}. ${p.abstract}`);
    for (const [notation, c] of counts) {
      mentionTotals.set(notation, (mentionTotals.get(notation) ?? 0) + c);
    }
  }

  // 2. paper counts + variant metadata straight from the DB relations
  const metaByNotation = new Map<string, { papers: number; variantType: string; classification: string; disease: string }>();
  for (const p of papers) {
    for (const v of p.variants) {
      const cur = metaByNotation.get(v.notation);
      if (cur) cur.papers += 1;
      else {
        metaByNotation.set(v.notation, {
          papers: 1,
          variantType: v.variantType,
          classification: v.classification,
          disease: v.disease,
        });
      }
    }
  }

  // 3. union — variants detected in text but not yet linked also appear
  const notations = new Set<string>([...mentionTotals.keys(), ...metaByNotation.keys()]);
  const rows: ReportRow[] = Array.from(notations)
    .map((notation) => {
      const m = metaByNotation.get(notation);
      const variantType = m?.variantType ?? (notation.endsWith("X") ? "Nonsense" : "Substitution");
      return {
        notation,
        mutationType: mutationTypeLabel(variantType, notation),
        mentions: mentionTotals.get(notation) ?? 0,
        papers: m?.papers ?? 0,
        classification: m?.classification ?? "Unclassified",
        disease: m?.disease ?? "",
      };
    })
    .sort((a, b) => b.mentions - a.mentions || b.papers - a.papers || a.notation.localeCompare(b.notation));

  const years = papers.map((p) => p.pubYear).filter((y): y is number => y != null);
  const meta = {
    papers: papers.length,
    variants: rows.length,
    totalMentions: rows.reduce((acc, r) => acc + r.mentions, 0),
    yearFrom: years.length ? Math.min(...years) : null,
    yearTo: years.length ? Math.max(...years) : null,
    generatedAt: new Date().toISOString().slice(0, 10),
    source: "NCBI PubMed E-utilities (esearch + efetch)",
  };

  return { meta, rows, markdown: buildMarkdown(rows, meta, lastTerm) };
}
