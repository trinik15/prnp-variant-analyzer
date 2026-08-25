/**
 * Evidence-tier vocabulary — the language the analyzer uses to describe
 * what it actually knows about each variant.
 *
 * Design rule (v2): the system never claims to "classify" clinical
 * significance on its own. It records and separates:
 *
 *   1. Reported variant          — machine-detected in the literature text
 *   2. Disease association       — what published literature reports for it
 *                                  (curated knowledge base, with citations)
 *   3. Functional evidence       — experimental/model data reported
 *   4. Population association    — cohort/population-level reports
 *   5. Clinical significance     — NOT asserted here; users are pointed to
 *                                  external databases (ClinVar)
 *   6. Provenance                — every row carries where each claim
 *                                  comes from
 *
 * Provenance PMIDs below were verified against live PubMed esearch
 * (landmark papers only — no fabricated references).
 */

export type EvidenceTier =
  | "curated" // Disease association reported in literature
  | "functional" // Functional / experimental evidence reported
  | "population" // Population-level association reported
  | "predicted" // Predicted pathogenic — unvalidated
  | "reported"; // Machine-detected reported variant, not yet annotated

export interface EvidenceInfo {
  tier: EvidenceTier;
  /** Short label for badges/tables. */
  label: string;
  /** What the tier claims — and explicitly what it does not. */
  detail: string;
  /** Where each part of the claim comes from. */
  provenance: string[];
}

const KB_PROVENANCE = [
  "Abstract text (machine-extracted by the regex pipeline)",
  "Curated knowledge base: Kovacs & Budka 2009; Minikel et al. 2016",
  "External cross-check: ClinVar (PRNP)",
];

const TEXT_ONLY_PROVENANCE = [
  "Abstract text (machine-extracted by the regex pipeline)",
  "External cross-check: ClinVar (PRNP)",
];

/** Tier derived purely from the curated knowledge-base classification. */
export function evidenceFor(classification: string): EvidenceInfo {
  switch (classification) {
    case "Pathogenic":
      return {
        tier: "curated",
        label: "Disease association reported in literature",
        detail:
          "Multiple published kindred reports describe this variant in affected families. This annotation is curated from the literature; it is not an independent clinical diagnosis.",
        provenance: KB_PROVENANCE,
      };
    case "Risk modifier":
      return {
        tier: "curated",
        label: "Risk association reported, penetrance debated",
        detail:
          "Reported in prion-disease cohorts but also found in controls; the literature does not agree on penetrance.",
        provenance: KB_PROVENANCE,
      };
    case "Protective":
      return {
        tier: "population",
        label: "Protective association reported",
        detail:
          "Population studies report reduced prion-disease risk for this variant; some also have experimental support.",
        provenance: KB_PROVENANCE,
      };
    case "Polymorphism":
      return {
        tier: "population",
        label: "Reported polymorphism (disease modifier)",
        detail:
          "A reported sequence polymorphism that modifies susceptibility or phenotype. Not itself pathogenic.",
        provenance: KB_PROVENANCE,
      };
    case "Pathogenic (predicted)":
      return {
        tier: "predicted",
        label: "Predicted pathogenic (unvalidated)",
        detail:
          "Predicted from the mutation type (e.g. premature stop). No curated disease report exists in the knowledge base; validate before use.",
        provenance: [
          "Abstract text (machine-extracted by the regex pipeline)",
          "Prediction rule: C-terminal truncations are reported as GSS-like",
          "External cross-check: ClinVar (PRNP)",
        ],
      };
    default:
      return {
        tier: "reported",
        label: "Reported variant (not yet annotated)",
        detail:
          "Machine-detected in the corpus text. No curated entry exists: the association is unknown, not negative. Cross-check ClinVar.",
        provenance: TEXT_ONLY_PROVENANCE,
      };
  }
}

/**
 * Overrides for variants with landmark primary literature — each provenance
 * PMID verified live via PubMed esearch/summary (2025-12 QA pass).
 */
const EVIDENCE_OVERRIDES: Record<string, EvidenceInfo> = {
  E200K: {
    tier: "curated",
    label: "Disease association reported in literature",
    detail:
      "Reported in affected kindreds worldwide (largest cluster: Libyan Jews); a cohort study reports complete penetrance of familial CJD in E200K carriers (Spudich et al., Mol Med 1995).",
    provenance: [
      "Abstract text (machine-extracted by the regex pipeline)",
      "Cohort study: Spudich et al., Mol Med 1995 (PMID 8529127)",
      "Curated knowledge base: Kovacs & Budka 2009; Minikel et al. 2016",
      "External cross-check: ClinVar (PRNP)",
    ],
  },
  D178N: {
    tier: "curated",
    label: "Disease association reported in literature",
    detail:
      "Phenotype depends on the codon-129 allele in cis: D178N on a 129M allele is reported as Fatal Familial Insomnia; D178N on 129V as familial CJD (Medori et al., NEJM 1992).",
    provenance: [
      "Abstract text (machine-extracted by the regex pipeline)",
      "Original report: Medori et al., N Engl J Med 1992 (PMID 1346338)",
      "Curated knowledge base: Kovacs & Budka 2009; Minikel et al. 2016",
      "External cross-check: ClinVar (PRNP)",
    ],
  },
  P102L: {
    tier: "functional",
    label: "Functional evidence reported",
    detail:
      "Beyond family linkage: transgenic mice carrying the P102L mutation spontaneously develop neurodegeneration (Hsiao et al., Science 1990), one of the few PRNP variants with experimental model evidence.",
    provenance: [
      "Abstract text (machine-extracted by the regex pipeline)",
      "Experimental model: Hsiao et al., Science 1990 (PMID 1980379)",
      "Curated knowledge base: Kovacs & Budka 2009; Minikel et al. 2016",
      "External cross-check: ClinVar (PRNP)",
    ],
  },
  M129V: {
    tier: "population",
    label: "Population association reported",
    detail:
      "The major genetic modifier of human prion disease: homozygous codon-129 genotype is reported to predispose to sporadic CJD (Palmer et al., Nature 1991).",
    provenance: [
      "Abstract text (machine-extracted by the regex pipeline)",
      "Association study: Palmer et al., Nature 1991 (PMID 1677164)",
      "Curated knowledge base: Kovacs & Budka 2009; Minikel et al. 2016",
      "External cross-check: ClinVar (PRNP)",
    ],
  },
  G127V: {
    tier: "functional",
    label: "Protective: population + experimental evidence",
    detail:
      "Colocalizes with kuru exposure in the Fore population of Papua New Guinea (Mead et al., NEJM 2009); laboratory assays report that the variant impedes prion propagation.",
    provenance: [
      "Abstract text (machine-extracted by the regex pipeline)",
      "Population + experimental: Mead et al., N Engl J Med 2009 (PMID 19923577)",
      "Curated knowledge base: Kovacs & Budka 2009; Minikel et al. 2016",
      "External cross-check: ClinVar (PRNP)",
    ],
  },
};

/** Classification + notation → evidence record (override-aware). */
export function evidenceForVariant(
  classification: string,
  notation: string,
): EvidenceInfo {
  return EVIDENCE_OVERRIDES[notation] ?? evidenceFor(classification);
}

/** Compact tier labels for narrow table cells. */
export const EVIDENCE_TIER_COMPACT: Record<EvidenceTier, string> = {
  curated: "Literature: disease association",
  functional: "Functional evidence",
  population: "Population association",
  predicted: "Predicted (unvalidated)",
  reported: "Reported variant",
};

export const EVIDENCE_TIER_STYLES: Record<
  EvidenceTier,
  { badge: string; dot: string }
> = {
  curated: {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
  },
  functional: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  population: {
    badge: "border-teal-500/30 bg-teal-500/10 text-teal-300",
    dot: "bg-teal-400",
  },
  predicted: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  reported: {
    badge: "border-zinc-600/50 bg-zinc-500/10 text-zinc-300",
    dot: "bg-zinc-400",
  },
};

/** ClinVar lookup URL for a given PRNP notation (external significance DB). */
export function clinvarUrl(notation: string): string {
  return `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(
    `PRNP[gene] AND ${notation}`,
  )}`;
}
