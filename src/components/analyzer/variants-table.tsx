"use client";

import { useEffect, useMemo, useState } from "react";
import { Dna, ExternalLink, Search } from "./icons";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { VariantDetailDialog } from "./variant-detail-dialog";
import { classificationStyle, CLASSIFICATIONS, type PaperDTO, type VariantDTO } from "./types";

interface VariantsTableProps {
  variants: VariantDTO[];
  papersByPmid?: Map<string, PaperDTO>;
}

interface PmidPanelState {
  variant: VariantDTO;
  top: number;
  right: number;
}

export function VariantsTable({ variants, papersByPmid }: VariantsTableProps) {
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState<string>("All");
  const [selected, setSelected] = useState<VariantDTO | null>(null);
  const [pmidPanel, setPmidPanel] = useState<PmidPanelState | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: variants.length };
    for (const v of variants) map[v.classification] = (map[v.classification] ?? 0) + 1;
    return map;
  }, [variants]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return variants.filter((v) => {
      if (classification !== "All" && v.classification !== classification) return false;
      if (!q) return true;
      return (
        v.notation.toLowerCase().includes(q) ||
        v.disease.toLowerCase().includes(q) ||
        v.variantType.toLowerCase().includes(q) ||
        String(v.position) === q
      );
    });
  }, [variants, query, classification]);

  // Close the lightweight paper list on Escape.
  useEffect(() => {
    if (!pmidPanel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPmidPanel(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pmidPanel]);

  const openPmidPanel = (v: VariantDTO, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setPmidPanel({
      variant: v,
      top: Math.min(r.bottom + 6, window.innerHeight - 250),
      right: Math.max(window.innerWidth - r.right, 12),
    });
  };

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter notation / disease / codon…"
            className="h-9 border-zinc-700 bg-zinc-950 pl-9 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {CLASSIFICATIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setClassification(c)}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors",
                classification === c
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200",
              )}
            >
              {c}
              <span className="ml-1 font-mono text-[10px] opacity-70">
                {counts[c] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <p className="ml-auto shrink-0 text-xs text-zinc-500">
          <span className="font-mono text-zinc-300">{filtered.length}</span> / {variants.length} variants
        </p>
      </div>

      {/* table */}
      <div className="custom-scrollbar max-h-[480px] overflow-y-auto rounded-md border border-zinc-800">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-zinc-900">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Variant</TableHead>
              <TableHead className="text-zinc-400">Codon</TableHead>
              <TableHead className="text-zinc-400">Type</TableHead>
              <TableHead className="text-zinc-400">Reported association</TableHead>
              <TableHead className="text-zinc-400">Disease</TableHead>
              <TableHead className="text-right text-zinc-400">Papers</TableHead>
              <TableHead className="hidden text-zinc-400 md:table-cell">Curated annotation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((v) => {
              const style = classificationStyle(v.classification);
              return (
                <TableRow
                  key={v.notation}
                  className="cursor-pointer border-zinc-800/70 hover:bg-zinc-800/40"
                  onClick={() => setSelected(v)}
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(v);
                      }}
                      className="rounded font-mono text-sm font-bold text-emerald-300 transition-colors hover:text-emerald-200 hover:underline decoration-emerald-500/40 underline-offset-2"
                      title={`Open the full evidence record for ${v.notation}`}
                    >
                      {v.notation}
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">
                    {v.position > 0 ? v.position : "n/a"}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400">{v.variantType}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border text-[11px]", style.badge)}>
                      {v.classification}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs text-zinc-300" title={v.disease}>
                    {v.disease || "n/a"}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPmidPanel(v, e.currentTarget);
                      }}
                      className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-emerald-300"
                      aria-label={`${v.paperCount} papers mentioning ${v.notation}, open list`}
                      aria-expanded={pmidPanel?.variant.notation === v.notation}
                    >
                      {v.paperCount}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </button>
                  </TableCell>
                  <TableCell className="hidden max-w-[340px] md:table-cell">
                    <p className="truncate text-xs text-zinc-500" title={v.description}>
                      {v.description || "n/a"}
                    </p>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <Dna className="h-6 w-6 opacity-40" />
                    <p className="text-sm">No variants match the current filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* lightweight paper list (position: fixed so the table scroll container
          never clips it; no portal, no library) */}
      {pmidPanel && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close paper list"
            onClick={() => setPmidPanel(null)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="dialog"
            aria-label={`PubMed records citing ${pmidPanel.variant.notation}`}
            className="fixed z-50 w-64 rounded-md border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
            style={{ top: pmidPanel.top, right: pmidPanel.right }}
          >
            <p className="mb-2 text-xs font-semibold text-zinc-200">
              PubMed records citing {pmidPanel.variant.notation}
            </p>
            <div className="custom-scrollbar max-h-48 space-y-1 overflow-y-auto">
              {pmidPanel.variant.pmids.slice(0, 30).map((pmid) => (
                <a
                  key={pmid}
                  href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-sm px-2 py-1 font-mono text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-emerald-300"
                >
                  PMID {pmid} ↗
                </a>
              ))}
              {pmidPanel.variant.pmids.length > 30 && (
                <p className="px-2 py-1 text-[11px] text-zinc-600">
                  +{pmidPanel.variant.pmids.length - 30} more in CSV export
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <p className="text-[11px] leading-relaxed text-zinc-600">
        Click any variant for its full evidence record: provenance, position on
        the PRNP protein and the citing papers. Categories reflect associations
        curated from the published literature (Kovacs &amp; Budka 2009; Minikel
        et al. 2016); they describe what the literature reports, not an
        independent clinical classification. Filter chips follow the
        knowledge-base vocabulary; cross-check every call against{" "}
        <a
          href="https://www.ncbi.nlm.nih.gov/clinvar/?term=PRNP%5Bgene%5D"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-emerald-300"
        >
          ClinVar
        </a>
        .
      </p>

      <VariantDetailDialog
        variant={selected}
        papersByPmid={papersByPmid ?? new Map()}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
