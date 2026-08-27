/**
 * Variant extraction engine.
 *
 * Scans article titles/abstracts for PRNP amino-acid substitutions written in:
 *   - one-letter notation:      E200K, D178N, Y145X
 *   - three-letter notation:    Glu200Lys, Gln227X, Gln227Ter
 *   - structural events:        octapeptide repeat insertion / deletion (OPRI/OPRD)
 *
 * Every candidate is validated against PRNP protein constraints
 * (codon range, known-aa flanks) to suppress false positives such as
 * virus names (H1N1) or years, then classified against the curated
 * knowledge base.
 */

import {
  KNOWN_VARIANTS,
  ONE_LETTER_AAs,
  PRNP_PROTEIN_LENGTH,
  THREE_TO_ONE,
  domainForPosition,
  type KnownVariantInfo,
} from "./knowledge";

export interface ExtractedVariant {
  notation: string;
  fromAA: string;
  toAA: string;
  position: number;
  variantType: "Substitution" | "Nonsense" | "Insertion" | "Deletion";
  info: KnownVariantInfo;
}

// Valid codon window: PRNP point mutations reported in the literature lie
// between the signal peptide and the GPI-anchor cleavage site.
export const MIN_CODON = 40;
export const MAX_CODON = PRNP_PROTEIN_LENGTH - 10;

/**
 * Compact one-letter notations that are famous variants of NON-PRNP proteins
 * falling INSIDE the PRNP codon window. They surface in prion-adjacent
 * literature (prion-like aggregation, differential diagnoses, COVID-era
 * wording) and would otherwise be misattributed to PRNP as "unclassified"
 * variants. Rejected before KB matching; the /api/extract guard reports them
 * with the offending gene.
 */
export const NON_PRNP_LOOKALIKES: Record<string, string> = {
  A53T: "SNCA (alpha-synuclein, Parkinson disease)",
  A30P: "SNCA (alpha-synuclein, Parkinson disease)",
  E46K: "SNCA (alpha-synuclein, Parkinson disease)",
  H63D: "HFE (hemochromatosis)",
  S65C: "HFE (hemochromatosis)",
  D614G: "SARS-CoV-2 spike",
  N501Y: "SARS-CoV-2 spike",
  E484K: "SARS-CoV-2 spike",
  K417N: "SARS-CoV-2 spike",
  H274Y: "influenza neuraminidase",
};

/**
 * PRNP codon-129 allele shorthand. The M/V polymorphism at codon 129 is the
 * dominant genetic modifier in prion disease and is very often written
 * WITHOUT the wild-type amino-acid prefix: "129M", "129V", "129MV" (the
 * heterozygous genotype), or in words: "Met129", "Val129". All of these
 * normalize to the curated M129V entry.
 */
export const CODON129_AFTER_RE = /\b129(M|V)\b/g; // "129M", "129V"
export const CODON129_GENOTYPE_RE = /\b129(MV|VM)\b/g; // heterozygote shorthand
export const CODON129_BEFORE_RE = /\b(Met|Val)129\b/g; // "Met129", "Val129"

/**
 * Count matches of a shared global regex safely. matchAll clones the regex
 * (inheriting lastIndex), so a prior .test()/exec on the SAME instance would
 * make the clone start mid-string and silently skip earlier matches. Reset
 * lastIndex around every use to keep results order-independent.
 */
export function countMatches(text: string, re: RegExp): number {
  re.lastIndex = 0;
  const n = Array.from(text.matchAll(re)).length;
  re.lastIndex = 0;
  return n;
}

const THREE_AA = Object.keys(THREE_TO_ONE)
  .filter((k) => k !== "Stop")
  .join("|");
const THREE_END = `${THREE_AA}|Ter|Stop|X`;

/** one-letter: E200K, D178N, V210I, Y145X (stop) */
export const ONE_ONE_RE = new RegExp(
  `\\b([${ONE_LETTER_AAs}])(\\d{2,3})([${ONE_LETTER_AAs}X*])\\b`,
  "g",
);

/** three-letter: Glu200Lys, Gln227Ter / Stop / X */
export const THREE_RE = new RegExp(
  `\\b(${THREE_AA})(\\d{2,3})(Ter|Stop|X|${THREE_AA})\\b`,
  "g",
);

/** octapeptide repeat insertions / deletions incl. repeat counts */
const OPRI_RE = /octapeptide[\s-]*repeat[\s-]*(?:region[\s-]*)?insertion|\b\d-OPRI|OPRI/i;
const OPRD_RE = /octapeptide[\s-]*repeat[\s-]*(?:region[\s-]*)?deletion|\b\d-OPRD|OPRD/i;
const OPRI_COUNT_RE = /\b(\d)[- ]?OPRI|\b([A-Za-z-]+)[\s-](?:extra|additional)?[\s-]?octapeptide[\s-]*repeat[\s-]*insertion/i;

function isValidCodon(pos: number): boolean {
  return Number.isInteger(pos) && pos >= MIN_CODON && pos <= MAX_CODON;
}

function infoFor(
  notation: string,
  fromAA: string,
  toAA: string,
  position: number,
  variantType: ExtractedVariant["variantType"],
): KnownVariantInfo {
  const known = KNOWN_VARIANTS[notation];
  if (known) return known;

  if (variantType === "Nonsense") {
    return {
      classification: "Pathogenic",
      disease: "Nonsense (predicted GSS-like)",
      description: `Premature stop codon at PRNP codon ${position} producing a C-terminally truncated PrP. C-terminal truncations are associated with GSS phenotypes; clinical significance of this specific codon requires validation.`,
    };
  }
  if (variantType === "Substitution" && fromAA === toAA) {
    return {
      classification: "Unclassified",
      disease: "",
      description: "Synonymous notation detected in text.",
    };
  }
  return {
    classification: "Unclassified",
    disease: "",
    description: `PRNP codon ${position} (${domainForPosition(position)}) change detected in the literature. No curated clinical annotation yet; flagged for independent verification against ClinVar.`,
  };
}

/**
 * Extract all PRNP variants mentioned in a piece of text
 * (title + abstract typically).
 */
export function extractVariants(text: string): ExtractedVariant[] {
  if (!text) return [];
  const out = new Map<string, ExtractedVariant>();

  // --- one-letter substitutions ---
  for (const m of text.matchAll(ONE_ONE_RE)) {
    const from = m[1];
    const to = m[3] === "*" ? "X" : m[3];
    const pos = Number(m[2]);
    if (!isValidCodon(pos)) continue;
    if (from === to) continue; // skip synonymous self-matches (e.g. "H2H")
    const notation = `${from}${pos}${to}`;
    if (NON_PRNP_LOOKALIKES[notation]) continue; // famous non-PRNP protein variant
    if (out.has(notation)) continue;
    const variantType: ExtractedVariant["variantType"] = to === "X" ? "Nonsense" : "Substitution";
    out.set(notation, {
      notation,
      fromAA: from,
      toAA: to,
      position: pos,
      variantType,
      info: infoFor(notation, from, to, pos, variantType),
    });
  }

  // --- three-letter substitutions ---
  for (const m of text.matchAll(THREE_RE)) {
    const from = THREE_TO_ONE[m[1]];
    const to = m[3] in THREE_TO_ONE ? THREE_TO_ONE[m[3]] : "X";
    const pos = Number(m[2]);
    if (!isValidCodon(pos)) continue;
    if (from === to) continue;
    const notation = `${from}${pos}${to}`;
    if (NON_PRNP_LOOKALIKES[notation]) continue; // e.g. "Ala53Thr" = SNCA A53T
    if (out.has(notation)) continue;
    const variantType: ExtractedVariant["variantType"] = to === "X" ? "Nonsense" : "Substitution";
    out.set(notation, {
      notation,
      fromAA: from,
      toAA: to,
      position: pos,
      variantType,
      info: infoFor(notation, from, to, pos, variantType),
    });
  }

  // --- octapeptide repeat events ---
  const hasOPRI = OPRI_RE.test(text);
  const hasOPRD = OPRD_RE.test(text);
  if (hasOPRI) {
    const countMatch = text.match(OPRI_COUNT_RE);
    const notation = "OPRI";
    if (!out.has(notation)) {
      out.set(notation, {
        notation,
        fromAA: "",
        toAA: "",
        position: 51,
        variantType: "Insertion",
        info: KNOWN_VARIANTS.OPRI,
      });
    }
    void countMatch;
  }
  if (hasOPRD && !out.has("OPRD")) {
    out.set("OPRD", {
      notation: "OPRD",
      fromAA: "",
      toAA: "",
      position: 51,
      variantType: "Deletion",
      info: KNOWN_VARIANTS.OPRD,
    });
  }

  // --- codon-129 allele shorthand -> the M129V polymorphism entry ---
  if (
    countMatches(text, CODON129_AFTER_RE) > 0 ||
    countMatches(text, CODON129_GENOTYPE_RE) > 0 ||
    countMatches(text, CODON129_BEFORE_RE) > 0
  ) {
    if (!out.has("M129V")) {
      out.set("M129V", {
        notation: "M129V",
        fromAA: "M",
        toAA: "V",
        position: 129,
        variantType: "Substitution",
        info: KNOWN_VARIANTS.M129V,
      });
    }
  }

  return Array.from(out.values());
}

/**
 * Count every textual occurrence of each variant notation in a text.
 * Mirrors the Python script's count_variant_mentions(): OPRI/OPRD are
 * counted once per document regardless of repeat mentions.
 */
export function countVariantMentions(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  if (!text) return counts;

  const bump = (notation: string) => {
    counts.set(notation, (counts.get(notation) ?? 0) + 1);
  };

  for (const m of text.matchAll(ONE_ONE_RE)) {
    const from = m[1];
    const to = m[3] === "*" ? "X" : m[3];
    const pos = Number(m[2]);
    if (!isValidCodon(pos) || from === to) continue;
    const notation = `${from}${pos}${to}`;
    if (NON_PRNP_LOOKALIKES[notation]) continue;
    bump(notation);
  }

  for (const m of text.matchAll(THREE_RE)) {
    const from = THREE_TO_ONE[m[1]];
    const to = m[3] in THREE_TO_ONE ? THREE_TO_ONE[m[3]] : "X";
    const pos = Number(m[2]);
    if (!isValidCodon(pos) || from === to) continue;
    const notation = `${from}${pos}${to}`;
    if (NON_PRNP_LOOKALIKES[notation]) continue;
    bump(notation);
  }

  // codon-129 shorthand counts as textual mentions of M129V
  for (const re of [CODON129_AFTER_RE, CODON129_GENOTYPE_RE, CODON129_BEFORE_RE]) {
    const n = countMatches(text, re);
    for (let i = 0; i < n; i++) bump("M129V");
  }

  if (OPRI_RE.test(text)) bump("OPRI");
  if (OPRD_RE.test(text)) bump("OPRD");

  return counts;
}

/** Human-readable mutation type used in reports (matches Python script). */
export function mutationTypeLabel(variantType: string, notation: string): string {
  if (notation === "OPRI") return "Insertion (octapeptide repeat)";
  if (notation === "OPRD") return "Deletion (octapeptide repeat)";
  if (variantType === "Nonsense") return "Nonsense (stop)";
  return "Missense";
}
