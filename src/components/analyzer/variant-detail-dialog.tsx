"use client";

import { useEffect, useMemo } from "react";
import { ArrowUpRight, Dna, FileText, FlaskConical, MapPin, ShieldCheck, X } from "./icons";
import { Badge } from "@/components/ui/badge";
import {
  EVIDENCE_TIER_STYLES,
  clinvarUrl,
  evidenceForVariant,
  type EvidenceTier,
} from "@/lib/prion/evidence";
import { PRNP_DOMAINS, PRNP_PROTEIN_LENGTH, domainForPosition } from "@/lib/prion/knowledge";
import { cn } from "@/lib/utils";
import { classificationStyle, type PaperDTO, type VariantDTO } from "./types";

interface VariantDetailDialogProps {
  variant: VariantDTO | null;
  papersByPmid: Map<string, PaperDTO>;
  onOpenChange: (open: boolean) => void;
}

/** Muted domain-segment palette (zinc scale + emerald accent, no blue). */
const DOMAIN_SHADES = [
  "bg-zinc-800",
  "bg-zinc-700/80",
  "bg-zinc-800/90",
  "bg-zinc-700",
  "bg-zinc-800",
  "bg-zinc-700/70",
  "bg-zinc-800/80",
  "bg-zinc-700/90",
  "bg-zinc-800",
  "bg-zinc-700/80",
  "bg-zinc-800/90",
];

export function VariantDetailDialog({
  variant,
  papersByPmid,
  onOpenChange,
}: VariantDetailDialogProps) {
  const evidence = useMemo(
    () => (variant ? evidenceForVariant(variant.classification, variant.notation) : null),
    [variant],
  );

  const citingPapers = useMemo(() => {
    if (!variant) return [];
    const out: PaperDTO[] = [];
    for (const pmid of variant.pmids) {
      const p = papersByPmid.get(pmid);
      if (p) out.push(p);
    }
    return out.sort((a, b) => (b.pubYear ?? 0) - (a.pubYear ?? 0));
  }, [variant, papersByPmid]);

  const domain = variant ? domainForPosition(variant.position) : "";

  // Escape closes, body scroll locks while the record is open.
  useEffect(() => {
    if (!variant) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [variant, onOpenChange]);

  if (!variant || !evidence) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="presentation">
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black/70"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${variant.notation} evidence record`}
          className="custom-scrollbar relative my-4 w-full max-w-2xl rounded-md border border-zinc-800 bg-zinc-950 p-0 shadow-2xl"
        >
          {/* close */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close evidence record"
            className="absolute right-3 top-3 rounded-sm border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="border-b border-zinc-800/80 px-5 pb-4 pt-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-3 pr-8">
              <h2 className="flex items-center gap-2.5 font-mono text-2xl font-bold text-emerald-300">
                <Dna className="h-6 w-6 text-emerald-400" />
                {variant.notation}
              </h2>
              <Badge
                variant="outline"
                className={cn("border text-[11px]", classificationStyle(variant.classification).badge)}
              >
                {variant.classification}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border text-[11px]",
                  EVIDENCE_TIER_STYLES[evidence.tier as EvidenceTier]?.badge,
                )}
              >
                {evidence.label}
              </Badge>
              <a
                href={clinvarUrl(variant.notation)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 rounded-sm border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                ClinVar <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              {variant.notation.startsWith("OPR")
                ? "Structural octapeptide-repeat event in PRNP codons 51-91."
                : `Amino-acid change at PRNP codon ${variant.position} (${domain}).`}{" "}
              Everything below reports what the literature and curated knowledge base
              say, not an independent clinical diagnosis.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            {/* key facts */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Fact label="Codon" value={variant.position > 0 ? String(variant.position) : "n/a"} />
              <Fact label="Domain" value={domain} small />
              <Fact label="Mutation type" value={variant.variantType} />
              <Fact label="Papers citing" value={String(variant.paperCount)} mono />
            </div>

            {/* PRNP domain map */}
            <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <MapPin className="h-3 w-3 text-emerald-400" />
                Position on the PRNP protein (253 aa)
              </p>
              <div className="relative">
                <div className="flex h-6 w-full gap-px overflow-hidden rounded-sm">
                  {PRNP_DOMAINS.map((d, i) => {
                    const active =
                      variant.position >= d.start && variant.position <= d.end;
                    return (
                      <div
                        key={d.name}
                        title={`${d.name} (${d.start}-${d.end})`}
                        style={{ width: `${((d.end - d.start + 1) / PRNP_PROTEIN_LENGTH) * 100}%` }}
                        className={cn(
                          "h-full transition-colors",
                          active ? "bg-emerald-500/70" : DOMAIN_SHADES[i % DOMAIN_SHADES.length],
                        )}
                      />
                    );
                  })}
                </div>
                {variant.position > 0 && (
                  <div
                    className="pointer-events-none absolute -top-1 bottom-[-4px] w-px bg-emerald-300"
                    style={{
                      left: `${((variant.position - 0.5) / PRNP_PROTEIN_LENGTH) * 100}%`,
                    }}
                  >
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-emerald-500 px-1 font-mono text-[9px] font-bold text-zinc-950">
                      {variant.position}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-zinc-600">
                {PRNP_DOMAINS.filter((d) => d.end - d.start > 10).map((d) => (
                  <span key={d.name}>{d.name}</span>
                ))}
              </div>
            </div>

            {/* evidence */}
            <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <FlaskConical className="h-3 w-3 text-emerald-400" />
                Evidence: what this annotation claims
              </p>
              <p className="text-[13px] leading-relaxed text-zinc-300">{evidence.detail}</p>
              <div className="mt-3 border-t border-zinc-800/80 pt-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  <ShieldCheck className="h-3 w-3 text-emerald-500/70" />
                  Provenance
                </p>
                <ul className="space-y-1">
                  {evidence.provenance.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[11px] leading-snug text-zinc-500">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* curated annotation */}
            {variant.description && (
              <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Curated annotation
                </p>
                <p className="text-[13px] leading-relaxed text-zinc-400">{variant.description}</p>
                {variant.disease && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Reported disease context:{" "}
                    <span className="font-medium text-zinc-300">{variant.disease}</span>
                  </p>
                )}
              </div>
            )}

            {/* citing papers */}
            <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="mb-2.5 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-emerald-400" />
                  Papers in this corpus citing {variant.notation}
                </span>
                <span className="font-mono text-[10px] text-zinc-600">
                  {citingPapers.length ? `${citingPapers.length} loaded` : "see CSV export"}
                </span>
              </p>
              {citingPapers.length > 0 ? (
                <div className="custom-scrollbar max-h-56 space-y-2 overflow-y-auto pr-1">
                  {citingPapers.map((p) => (
                    <a
                      key={p.pmid}
                      href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-sm border border-zinc-800/80 bg-zinc-950/70 p-2.5 transition-colors hover:border-emerald-500/30"
                    >
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-300">
                        {p.title}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-600">
                        {p.journal}
                        {p.pubYear ? ` · ${p.pubYear}` : ""} ·{" "}
                        <span className="font-mono text-emerald-400/80">PMID {p.pmid} ↗</span>
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] leading-relaxed text-zinc-600">
                  {variant.pmids.length} paper(s) cite this variant in the stored corpus
                  metadata; open the Papers tab or the CSV export for the full list.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  small,
  mono,
}: {
  label: string;
  value: string;
  small?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="rounded-sm border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-medium text-zinc-200",
          small ? "truncate text-[11px]" : "text-sm",
          mono && "font-mono",
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
