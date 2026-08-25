/**
 * PRNP knowledge base — curated annotations for known human prion-protein
 * variants, plus amino-acid utilities shared by the extraction engine.
 *
 * Sources: ClinVar, UniProt P04156 (PRNP_HUMAN), published literature
 * (Kovacs & Budka 2009; Minikel et al. 2016; IMTSSA/PRNP mutation database).
 */

export const PRNP_PROTEIN_LENGTH = 253; // human PRNP isoform (1-253, incl. signal peptide)

/** Human PRNP functional domains (mature protein numbering). */
export const PRNP_DOMAINS: { start: number; end: number; name: string }[] = [
  { start: 1, end: 22, name: "Signal peptide" },
  { start: 23, end: 50, name: "N-terminal basic region" },
  { start: 51, end: 91, name: "Octapeptide repeat region" },
  { start: 92, end: 111, name: "Hydrophobic core (CR)" },
  { start: 112, end: 143, name: "Globular domain N-term" },
  { start: 144, end: 154, name: "Helix 1" },
  { start: 155, end: 172, name: "Loop / Strand 2" },
  { start: 173, end: 194, name: "Helix 2" },
  { start: 195, end: 199, name: "Loop 2-3" },
  { start: 200, end: 228, name: "Helix 3" },
  { start: 229, end: 253, name: "GPI-anchor signal" },
];

export function domainForPosition(pos: number): string {
  const d = PRNP_DOMAINS.find((x) => pos >= x.start && pos <= x.end);
  return d ? d.name : "Unknown region";
}

export interface KnownVariantInfo {
  classification:
    | "Pathogenic"
    | "Risk modifier"
    | "Protective"
    | "Polymorphism"
    | "Unclassified";
  disease: string;
  description: string;
}

/**
 * Curated map of well-established PRNP variants.
 * Notation: {one-letter original aa}{codon}{one-letter replacement} (stop = X).
 */
export const KNOWN_VARIANTS: Record<string, KnownVariantInfo> = {
  // ---- Gerstmann-Sträussler-Scheinker syndrome (GSS) ----
  P102L: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "Prototypic GSS mutation; the first human prion disease mutation identified (Hsiao et al. 1989). Amyloid plaques, ataxia, slow course.",
  },
  P105L: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "GSS variant with dementia-dominant phenotype; described in Japanese and other families.",
  },
  G114V: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "Rare GSS-associated substitution in the globular domain N-terminus.",
  },
  A117V: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "GSS 'Tel-Aviv' variant; alanine-to-valine replacement in beta-strand 1, classic amyloid-dominant phenotype.",
  },
  G131V: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "GSS variant in beta-strand 1; often with slowly progressive dementia.",
  },
  A133V: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "GSS-associated substitution; reported in British and Japanese kindreds.",
  },
  Y145X: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "Stop mutation producing C-terminally truncated PrP; tau-positive amyloid plaques, Alzheimer-like pathology.",
  },
  Q160X: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "Nonsense variant truncating PrP; GSS phenotype with PrP amyloid deposition.",
  },
  Y163X: {
    classification: "Pathogenic",
    disease: "GSS",
    description: "Truncating stop mutation associated with GSS-like disease.",
  },
  H187R: {
    classification: "Pathogenic",
    disease: "GSS",
    description: "GSS mutation in helix 2; reported in Chinese kindreds.",
  },
  F198S: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "Classic GSS mutation (Indiana kindred); neurofibrillary tangles with PrP amyloid plaques.",
  },
  F198L: {
    classification: "Pathogenic",
    disease: "GSS",
    description: "Rare GSS-associated variant at the same codon as F198S.",
  },
  D202N: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "GSS variant with prominent dementia and mild ataxia; slower progression.",
  },
  Q212P: {
    classification: "Pathogenic",
    disease: "GSS",
    description: "GSS mutation in helix 3; proline disrupts helical structure.",
  },
  Q217R: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "GSS mutation (Dutch kindred); neurofibrillary tangles, long disease duration.",
  },
  Y226X: {
    classification: "Pathogenic",
    disease: "GSS",
    description: "C-terminal truncating stop mutation; GSS phenotype.",
  },
  Q227X: {
    classification: "Pathogenic",
    disease: "GSS",
    description:
      "Stop mutation removing helix 3 C-terminus; GSS with PrP amyloid.",
  },
  G131S: {
    classification: "Pathogenic",
    disease: "GSS",
    description: "Rare GSS-associated substitution in beta-strand 1.",
  },

  // ---- Fatal Familial Insomnia (FFI) ----
  D178N: {
    classification: "Pathogenic",
    disease: "FFI / fCJD",
    description:
      "Aspartate-to-asparagine at codon 178. Phenotype driven by codon 129 in cis: D178N-M129 = Fatal Familial Insomnia; D178N-V129 = familial CJD.",
  },

  // ---- Familial / genetic CJD (fCJD, gPrD) ----
  V180I: {
    classification: "Pathogenic",
    disease: "fCJD",
    description:
      "One of the most common mutations in Japan; loss of hydrophobic residue in helix 2.",
  },
  T183A: {
    classification: "Pathogenic",
    disease: "fCJD",
    description:
      "Helix-2 start mutation; altered glycosylation and PrP-res formation.",
  },
  T188A: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "fCJD-associated substitution within helix 2.",
  },
  T188K: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "fCJD-associated substitution within helix 2.",
  },
  T188R: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "fCJD-associated substitution within helix 2.",
  },
  H187Y: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "Rare helix-2 substitution associated with gPrD.",
  },
  E196K: {
    classification: "Pathogenic",
    disease: "fCJD",
    description:
      "fCJD mutation reported in Chinese and European families; rapidly progressive phenotype.",
  },
  E196A: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "Rare familial CJD substitution at codon 196.",
  },
  E200K: {
    classification: "Pathogenic",
    disease: "fCJD",
    description:
      "The most common pathogenic PRNP mutation worldwide (Libyan Jews, Chile, Slovakia clusters). Penetrance ~100% by age 80 in 129M cis backgrounds.",
  },
  E200G: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "Rare familial CJD variant at the E200 codon.",
  },
  E200L: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "Rare familial CJD variant at the E200 codon.",
  },
  V203I: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "fCJD mutation described in Japanese and European patients.",
  },
  R208H: {
    classification: "Pathogenic",
    disease: "fCJD",
    description:
      "fCJD substitution in helix 3; documented in several European families.",
  },
  V210I: {
    classification: "Pathogenic",
    disease: "fCJD",
    description:
      "Frequent fCJD mutation in Italy and France; phenotype resembles sCJD MM2.",
  },
  E211K: {
    classification: "Risk modifier",
    disease: "fCJD (risk)",
    description:
      "Biochemically analogous to the bovine BSE (E211K) mutation; extremely rare human variant.",
  },
  E211Q: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "Rare familial prion disease variant at codon 211.",
  },
  M232T: {
    classification: "Risk modifier",
    disease: "gPrD (uncertain)",
    description:
      "Variant of uncertain significance; reported in CJD patients but also in controls.",
  },
  M232R: {
    classification: "Risk modifier",
    disease: "gPrD (uncertain)",
    description:
      "Rare variant reported in association with genetic CJD; also found in healthy elderly.",
  },

  // ---- Polymorphisms / modifiers ----
  M129V: {
    classification: "Polymorphism",
    disease: "Codon 129 modifier",
    description:
      "The major genetic modifier of prion disease: Met/Val codon-129 polymorphism determines susceptibility, incubation period and phenotype of sporadic, acquired and genetic prion disease. 129M cis confers FFI with D178N.",
  },
  G127V: {
    classification: "Protective",
    disease: "Kuru resistance",
    description:
      "Protective polymorphism in Papua New Guinea (Fore) populations; confers resistance to kuru and laboratory shows de novo prion resistance.",
  },
  E219K: {
    classification: "Protective",
    disease: "sCJD resistance (East Asian)",
    description:
      "Glutamine/lysine polymorphism at codon 219; lysine allele protects against sporadic CJD in Japanese/Korean cohorts.",
  },
  V148I: {
    classification: "Polymorphism",
    disease: "Rare modifier",
    description:
      "Rare polymorphism of uncertain effect; reported in prion cohorts.",
  },
  N171S: {
    classification: "Risk modifier",
    disease: "Reduced penetrance",
    description:
      "Rare variant with reduced penetrance; reported in CJD cases and controls.",
  },
  R15C: {
    classification: "Risk modifier",
    disease: "Reduced penetrance",
    description:
      "N-terminal variant; large cohort analyses suggest moderate effect on prion-disease risk.",
  },
  R15S: {
    classification: "Risk modifier",
    disease: "Reduced penetrance",
    description: "N-terminal variant with reported reduced penetrance.",
  },
  G95S: {
    classification: "Risk modifier",
    disease: "Reduced penetrance",
    description: "Variant upstream of hydrophobic core; penetrance debated.",
  },
  R208C: {
    classification: "Pathogenic",
    disease: "fCJD",
    description: "Rare helix-3 substitution reported in genetic prion disease.",
  },

  // ---- Structural (non point-mutation) events ----
  OPRI: {
    classification: "Pathogenic",
    disease: "fCJD / GSS / FFI-like",
    description:
      "Octapeptide-repeat insertion (2-9 extra repeats) in PRNP codons 51-91. Longer insertions lead to earlier onset; psychiatric onset is common; phenotype correlates with repeat number and 129 genotype.",
  },
  OPRD: {
    classification: "Risk modifier",
    disease: "Reduced penetrance",
    description:
      "Octapeptide-repeat deletion (usually 1-2 repeats); generally low or no penetrance, considered a benign/modifier variant.",
  },
};

export const CLASSIFICATION_STYLES: Record<
  string,
  { badge: string; dot: string; chart: string }
> = {
  Pathogenic: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-400",
    chart: "#fb7185",
  },
  "Risk modifier": {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
    chart: "#fbbf24",
  },
  Protective: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-400",
    chart: "#34d399",
  },
  Polymorphism: {
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    dot: "bg-teal-400",
    chart: "#2dd4bf",
  },
  Unclassified: {
    badge: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
    dot: "bg-zinc-400",
    chart: "#a1a1aa",
  },
};

export function classificationStyle(name: string) {
  return CLASSIFICATION_STYLES[name] ?? CLASSIFICATION_STYLES.Unclassified;
}

/** Three-letter to one-letter amino-acid codes. */
export const THREE_TO_ONE: Record<string, string> = {
  Ala: "A", Arg: "R", Asn: "N", Asp: "D", Cys: "C", Gln: "Q", Glu: "E",
  Gly: "G", His: "H", Ile: "I", Leu: "L", Lys: "K", Met: "M", Phe: "F",
  Pro: "P", Ser: "S", Thr: "T", Trp: "W", Tyr: "Y", Val: "V", Ter: "X",
  Stop: "X", Sec: "U", Pyl: "O",
};

export const ONE_LETTER_AAs = "ACDEFGHIKLMNPQRSTVWY";
