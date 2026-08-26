/** Client-safe shared types for the analyzer UI. */
export type {
  VariantDTO,
  PaperDTO,
  StatsDTO,
  AnalyzeResponse,
} from "@/lib/prion/types";

export { classificationStyle } from "@/lib/prion/knowledge";
export { PRNP_DOMAINS, domainForPosition } from "@/lib/prion/knowledge";

export interface SearchParams {
  term: string;
  retmax: number;
  mindate?: string;
  maxdate?: string;
}

export const PRESET_QUERIES: { label: string; term: string }[] = [
  { label: "PRNP mutation", term: "PRNP mutation" },
  { label: "E200K / D178N", term: "PRNP AND (E200K OR D178N)" },
  { label: "Fatal Familial Insomnia", term: "fatal familial insomnia PRNP" },
  { label: "GSS syndrome", term: "Gerstmann-Straussler-Scheinker PRNP" },
  { label: "Octapeptide repeats", term: "PRNP octapeptide repeat" },
  { label: "Genetic prion disease", term: "genetic prion disease PRNP genotype" },
  { label: "Codon 129 polymorphism", term: "PRNP codon 129 polymorphism" },
];

export const CLASSIFICATIONS = [
  "All",
  "Pathogenic",
  "Risk modifier",
  "Protective",
  "Polymorphism",
  "Unclassified",
] as const;
