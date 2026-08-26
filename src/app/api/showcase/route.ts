/**
 * GET /api/showcase — proof-of-capability endpoint.
 *
 * Returns one complete end-to-end example of what the analyzer produces:
 *   rows            — top corpus variants joined to a real paper reporting
 *                     them, each annotated with evidence tier + provenance
 *   sampleAbstract  — an actual abstract from the corpus, pre-split into
 *                     highlight segments (variant notations marked)
 *   csvPreview      — the exact column structure streamed by /api/export
 *   markdownPreview — the exact frequency-table format of /api/report
 *
 * Falls back to verified landmark papers (PMIDs checked against live
 * PubMed esearch) when the corpus is still empty.
 */

import { NextResponse } from "next/server";
import { loadPapersFromDb, loadVariantsFromDb } from "@/lib/prion/data";
import {
  EVIDENCE_TIER_COMPACT,
  evidenceForVariant,
  type EvidenceTier,
} from "@/lib/prion/evidence";
import { countVariantMentions, mutationTypeLabel } from "@/lib/prion/extract";
import { ONE_LETTER_AAs, THREE_TO_ONE } from "@/lib/prion/knowledge";

export const dynamic = "force-dynamic";

interface ShowcaseRow {
  notation: string;
  classification: string;
  syndrome: string;
  tier: EvidenceTier;
  evidenceLabel: string;
  evidenceDetail: string;
  provenance: string[];
  pmid: string;
  paperTitle: string;
  journal: string;
  year: number | null;
}

interface Segment {
  t: string;
  v: boolean;
}

const CSV_HEADER = [
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
];

const MIN_CODON = 40;
const MAX_CODON = 243; // PRNP length 253 − 10

const ONE_RE = new RegExp(`\\b([${ONE_LETTER_AAs}])(\\d{2,3})([${ONE_LETTER_AAs}X*])\\b`, "g");
const THREE_RE = new RegExp(
  `\\b(${Object.keys(THREE_TO_ONE).filter((k) => k !== "Stop").join("|")})(\\d{2,3})(Ter|Stop|X|${Object.keys(THREE_TO_ONE).join("|")})\\b`,
  "g",
);

/** Split text into {plain, variant-notation} segments (codon-window validated). */
function buildSegments(text: string): Segment[] {
  const ranges: [number, number][] = [];

  for (const m of text.matchAll(ONE_RE)) {
    const pos = Number(m[2]);
    if (pos < MIN_CODON || pos > MAX_CODON || m[1] === m[3]) continue;
    ranges.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  for (const m of text.matchAll(THREE_RE)) {
    const pos = Number(m[2]);
    const from = THREE_TO_ONE[m[1]];
    const to = m[3] in THREE_TO_ONE ? THREE_TO_ONE[m[3]] : "X";
    if (pos < MIN_CODON || pos > MAX_CODON || from === to) continue;
    ranges.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r] as [number, number]);
  }

  const segs: Segment[] = [];
  let cur = 0;
  for (const [s, e] of merged) {
    if (s > cur) segs.push({ t: text.slice(cur, s), v: false });
    segs.push({ t: text.slice(s, e), v: true });
    cur = e;
  }
  if (cur < text.length) segs.push({ t: text.slice(cur), v: false });
  return segs;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Verified landmark fallback rows (PMIDs confirmed via PubMed esearch). */
function fallbackRows(): ShowcaseRow[] {
  const landmarks: Array<{
    notation: string;
    classification: string;
    syndrome: string;
    pmid: string;
    paperTitle: string;
    journal: string;
    year: number;
  }> = [
    {
      notation: "E200K",
      classification: "Pathogenic",
      syndrome: "fCJD",
      pmid: "8529127",
      paperTitle:
        "Complete penetrance of Creutzfeldt-Jakob disease in Libyan Jews carrying the E200K mutation in the prion protein gene",
      journal: "Mol Med",
      year: 1995,
    },
    {
      notation: "D178N",
      classification: "Pathogenic",
      syndrome: "FFI / fCJD (129 cis)",
      pmid: "1346338",
      paperTitle:
        "Fatal familial insomnia, a prion disease with a mutation at codon 178 of the prion protein gene",
      journal: "N Engl J Med",
      year: 1992,
    },
    {
      notation: "P102L",
      classification: "Pathogenic",
      syndrome: "GSS",
      pmid: "1980379",
      paperTitle:
        "Spontaneous neurodegeneration in transgenic mice with mutant prion protein",
      journal: "Science",
      year: 1990,
    },
    {
      notation: "M129V",
      classification: "Polymorphism",
      syndrome: "sCJD susceptibility modifier",
      pmid: "1677164",
      paperTitle:
        "Homozygous prion protein genotype predisposes to sporadic Creutzfeldt-Jakob disease",
      journal: "Nature",
      year: 1991,
    },
    {
      notation: "G127V",
      classification: "Protective",
      syndrome: "Kuru resistance (Fore)",
      pmid: "19923577",
      paperTitle:
        "A novel protective prion protein variant that colocalizes with kuru exposure",
      journal: "N Engl J Med",
      year: 2009,
    },
    {
      notation: "OPRI",
      classification: "Pathogenic",
      syndrome: "fCJD / GSS",
      pmid: "2563037",
      paperTitle:
        "Insertion in prion protein gene in familial Creutzfeldt-Jakob disease",
      journal: "Lancet",
      year: 1989,
    },
  ];

  return landmarks.map((l) => {
    const ev = evidenceForVariant(l.classification, l.notation);
    return {
      notation: l.notation,
      classification: l.classification,
      syndrome: l.syndrome,
      tier: ev.tier,
      evidenceLabel: EVIDENCE_TIER_COMPACT[ev.tier],
      evidenceDetail: ev.detail,
      provenance: ev.provenance,
      pmid: l.pmid,
      paperTitle: l.paperTitle,
      journal: l.journal,
      year: l.year,
    };
  });
}

async function buildShowcase() {
  const [variants, papers] = await Promise.all([loadVariantsFromDb(), loadPapersFromDb()]);

  if (variants.length === 0 || papers.length === 0) {
    return {
      ok: true as const,
      source: "fallback" as const,
      meta: {
        papers: papers.length,
        variants: variants.length,
        generatedAt: new Date().toISOString(),
      },
      rows: fallbackRows(),
      sampleAbstract: null,
      csvPreview: {
        header: CSV_HEADER,
        rows: [
          [
            "E200K", "200", "E", "K", "Substitution", "Pathogenic", "fCJD",
            "1", "8529127",
            "Most common pathogenic PRNP mutation worldwide",
          ],
          [
            "D178N", "178", "D", "N", "Substitution", "Pathogenic", "FFI / fCJD",
            "1", "1346338",
            "129M cis = FFI; 129V cis = fCJD",
          ],
        ],
      },
      markdownPreview: null as string | null,
    };
  }

  const papersByPmid = new Map(papers.map((p) => [p.pmid, p]));

  // --- rows: top variants joined to their most recent reporting paper ---
  const rows: ShowcaseRow[] = [];
  const candidatePapers: string[] = [];
  for (const v of variants) {
    if (rows.length >= 6) break;
    const pmid = v.pmids.find((id) => papersByPmid.has(id));
    if (!pmid) continue;
    const paper = papersByPmid.get(pmid)!;
    const ev = evidenceForVariant(v.classification, v.notation);
    rows.push({
      notation: v.notation,
      classification: v.classification,
      syndrome: v.disease || "n/a",
      tier: ev.tier,
      evidenceLabel: EVIDENCE_TIER_COMPACT[ev.tier],
      evidenceDetail: ev.detail,
      provenance: ev.provenance,
      pmid: paper.pmid,
      paperTitle: paper.title,
      journal: paper.journal,
      year: paper.pubYear,
    });
    candidatePapers.push(paper.pmid);
  }

  // --- sample abstract: real text, most variant-dense among row papers ---
  let sampleAbstract: {
    pmid: string;
    journal: string;
    year: number | null;
    notations: string[];
    segments: Segment[];
  } | null = null;

  let best: { pmid: string; score: number; text: string; notations: string[] } | null = null;
  for (const pmid of candidatePapers) {
    const p = papersByPmid.get(pmid);
    if (!p || p.abstract.length < 180) continue;
    const text = truncate(p.abstract, 560);
    const segs = buildSegments(text);
    const hits = segs.filter((s) => s.v).length;
    if (hits < 2) continue;
    const score = hits * 2 + Math.min(text.length, 500) / 250;
    if (!best || score > best.score) {
      best = {
        pmid,
        score,
        text,
        notations: segs.filter((s) => s.v).map((s) => s.t),
      };
    }
  }
  if (best) {
    const p = papersByPmid.get(best.pmid)!;
    sampleAbstract = {
      pmid: p.pmid,
      journal: p.journal,
      year: p.pubYear,
      notations: Array.from(new Set(best.notations)).slice(0, 8),
      segments: buildSegments(best.text),
    };
  }

  // --- csv preview: real structure, real top-2 variants ---
  const csvRows = rows.slice(0, 2).map((r) => {
    const v = variants.find((x) => x.notation === r.notation)!;
    return [
      v.notation,
      String(v.position || ""),
      v.fromAA,
      v.toAA,
      v.variantType,
      v.classification,
      v.disease,
      String(v.paperCount),
      v.pmids.slice(0, 3).join(" "),
      truncate(v.description || "", 90),
    ];
  });

  // --- markdown preview: real mention counts, same format as /api/report ---
  const mentions = new Map<string, number>();
  for (const p of papers) {
    for (const [notation, c] of countVariantMentions(`${p.title}. ${p.abstract}`)) {
      mentions.set(notation, (mentions.get(notation) ?? 0) + c);
    }
  }
  const mdLines: string[] = [
    "| Variant | Mutation Type | Number of Mentions |",
    "|---------|---------------|--------------------|",
  ];
  for (const r of rows.slice(0, 4)) {
    const v = variants.find((x) => x.notation === r.notation)!;
    mdLines.push(
      `| ${v.notation} | ${mutationTypeLabel(v.variantType, v.notation)} | ${mentions.get(v.notation) ?? v.paperCount} |`,
    );
  }

  return {
    ok: true as const,
    source: "live" as const,
    meta: {
      papers: papers.length,
      variants: variants.length,
      generatedAt: new Date().toISOString(),
    },
    rows,
    sampleAbstract,
    csvPreview: { header: CSV_HEADER, rows: csvRows },
    markdownPreview: mdLines.join("\n"),
  };
}

export async function GET() {
  try {
    const data = await buildShowcase();
    return NextResponse.json(data);
  } catch (err) {
    console.error("showcase error:", err);
    // never break the landing page — degrade to verified landmarks
    return NextResponse.json({
      ok: true,
      source: "fallback",
      meta: { papers: 0, variants: 0, generatedAt: new Date().toISOString() },
      rows: fallbackRows(),
      csvPreview: {
        header: CSV_HEADER,
        rows: [["n/a"]],
      },
      sampleAbstract: null,
      markdownPreview: null,
    });
  }
}
