/**
 * POST /api/extract — zero-setup playground endpoint.
 *
 * Runs the same deterministic extraction pipeline used for the corpus
 * (regex scanners → codon-window validation → knowledge-base matching →
 * evidence tiers) on arbitrary user-supplied text. No PubMed call,
 * no database write — pure function over text.
 */

import { NextResponse } from "next/server";
import {
  ONE_ONE_RE,
  THREE_RE,
  NON_PRNP_LOOKALIKES,
  CODON129_AFTER_RE,
  CODON129_GENOTYPE_RE,
  CODON129_BEFORE_RE,
  countVariantMentions,
  countMatches,
  extractVariants,
  mutationTypeLabel,
  MAX_CODON,
  MIN_CODON,
} from "@/lib/prion/extract";
import { domainForPosition, THREE_TO_ONE } from "@/lib/prion/knowledge";
import { evidenceForVariant } from "@/lib/prion/evidence";
import { detectContext } from "@/lib/prion/context";

const MAX_CHARS = 12000;

export interface ExtractedVariantDTO {
  notation: string;
  position: number;
  variantType: string;
  variantTypeLabel: string;
  domain: string;
  mentions: number;
  classification: string;
  disease: string;
  description: string;
  evidence: {
    tier: string;
    label: string;
    detail: string;
    provenance: string[];
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { text?: unknown } | null;
    const text = typeof body?.text === "string" ? body.text : "";
    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, error: "No text supplied. Paste an abstract or case description." },
        { status: 400 },
      );
    }

    const clipped = text.slice(0, MAX_CHARS);

    // --- variant extraction (identical to the corpus pipeline) ---
    const extracted = extractVariants(clipped);
    const mentions = countVariantMentions(clipped);

    // --- show the guards working: categorize every rejected candidate ---
    let rawOneLetter = 0;
    let rejected = 0;
    let outOfWindow = 0;
    let synonymous = 0;
    const nonPrnp: { notation: string; gene: string }[] = [];
    for (const m of clipped.matchAll(ONE_ONE_RE)) {
      rawOneLetter += 1;
      const from = m[1];
      const to = m[3] === "*" ? "X" : m[3];
      const pos = Number(m[2]);
      const notation = `${from}${pos}${to}`;
      if (pos < MIN_CODON || pos > MAX_CODON) {
        outOfWindow += 1; // e.g. D614G, N501Y, boundary probes
        rejected += 1;
      } else if (from === to) {
        synonymous += 1; // self-matches ("H2H")
        rejected += 1;
      } else if (NON_PRNP_LOOKALIKES[notation]) {
        nonPrnp.push({ notation, gene: NON_PRNP_LOOKALIKES[notation] }); // e.g. A53T = SNCA
        rejected += 1;
      }
    }
    // three-letter spellings of the same cross-gene lookalikes (e.g. Ala53Thr)
    for (const m of clipped.matchAll(THREE_RE)) {
      const toRaw = m[3];
      const pos = Number(m[2]);
      if (pos < MIN_CODON || pos > MAX_CODON) continue; // already counted if one-letter form present
      const norm = `${THREE_TO_ONE[m[1]]}${pos}${toRaw in THREE_TO_ONE ? THREE_TO_ONE[toRaw] : "X"}`;
      if (NON_PRNP_LOOKALIKES[norm] && !nonPrnp.some((r) => r.notation === norm)) {
        nonPrnp.push({ notation: norm, gene: NON_PRNP_LOOKALIKES[norm] });
      }
    }
    let codon129Shorthand = 0;
    for (const re of [CODON129_AFTER_RE, CODON129_GENOTYPE_RE, CODON129_BEFORE_RE]) {
      codon129Shorthand += countMatches(clipped, re);
    }

    const variants: ExtractedVariantDTO[] = extracted
      .map((v) => {
        const evidence = evidenceForVariant(v.info.classification, v.notation);
        return {
          notation: v.notation,
          position: v.position,
          variantType: v.variantType,
          variantTypeLabel: mutationTypeLabel(v.variantType, v.notation),
          domain: domainForPosition(v.position),
          mentions: mentions.get(v.notation) ?? 1,
          classification: v.info.classification,
          disease: v.info.disease,
          description: v.info.description,
          evidence: {
            tier: evidence.tier,
            label: evidence.label,
            detail: evidence.detail,
            provenance: evidence.provenance,
          },
        };
      })
      .sort((a, b) => b.mentions - a.mentions || a.position - b.position);

    return NextResponse.json({
      ok: true,
      chars: clipped.length,
      truncated: text.length > MAX_CHARS,
      rawOneLetter,
      rejected,
      guard: {
        outOfWindow,
        synonymous,
        nonPrnp,
        codon129Shorthand,
      },
      context: detectContext(clipped),
      variants,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Extraction failed. Please check the input text." },
      { status: 500 },
    );
  }
}
