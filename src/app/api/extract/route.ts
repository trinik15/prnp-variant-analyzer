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
  countVariantMentions,
  extractVariants,
  mutationTypeLabel,
} from "@/lib/prion/extract";
import { domainForPosition } from "@/lib/prion/knowledge";
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
