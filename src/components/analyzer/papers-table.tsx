"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, FileText, Search } from "./icons";
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
import {
  detectPaperContext,
  ETIOLOGY_LABELS,
  ETIOLOGY_STYLES,
  FEATURE_BADGE,
  MODALITY_BADGE,
  type PaperContext,
} from "@/lib/prion/context";
import { cn } from "@/lib/utils";
import type { PaperDTO } from "./types";

interface PapersTableProps {
  papers: PaperDTO[];
}

function highlightVariants(text: string, variants: string[]) {
  if (!variants.length || !text) return text;
  // Build a single regex over variant notations, longest first
  const sorted = [...variants].sort((a, b) => b.length - a.length);
  const re = new RegExp(`\\b(${sorted.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "g");
  const parts = text.split(re);
  return parts.map((part, i) =>
    sorted.includes(part) ? (
      <mark key={i} className="rounded-sm bg-emerald-500/20 px-0.5 font-mono text-[0.92em] text-emerald-300">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function PapersTable({ papers }: PapersTableProps) {
  const [query, setQuery] = useState("");
  const [etiologyFilter, setEtiologyFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((p) => {
      if (etiologyFilter !== "all") {
        const ctx = detectPaperContext(p.title, p.abstract);
        if (!ctx.etiology.includes(etiologyFilter)) return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.journal.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        p.pmid.includes(q) ||
        p.variants.some((v) => v.toLowerCase().includes(q))
      );
    });
  }, [papers, query, etiologyFilter]);

  // Clinical context (etiology / diagnostics / features) detected from
  // title + abstract: deterministic keyword rules, computed once per set.
  const contextByPmid = useMemo(() => {
    const m = new Map<string, PaperContext>();
    for (const p of papers) {
      m.set(p.pmid, detectPaperContext(p.title, p.abstract));
    }
    return m;
  }, [papers]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter title / journal / author / variant…"
              className="h-9 border-zinc-700 bg-zinc-950 pl-9 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <select
            aria-label="Filter by etiology context"
            value={etiologyFilter}
            onChange={(e) => setEtiologyFilter(e.target.value)}
            className="h-9 w-[168px] shrink-0 rounded-sm border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            <option value="all">All etiologies</option>
            {Object.values(ETIOLOGY_LABELS).map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <p className="sm:ml-auto text-xs text-zinc-500">
          <span className="font-mono text-zinc-300">{filtered.length}</span> / {papers.length} papers ·
          click a row for the abstract
        </p>
      </div>

      <div className="custom-scrollbar max-h-[560px] overflow-y-auto rounded-md border border-zinc-800">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-zinc-900">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-16 text-zinc-400">Year</TableHead>
              <TableHead className="text-zinc-400">Title & authors</TableHead>
              <TableHead className="hidden w-44 text-zinc-400 lg:table-cell">Journal</TableHead>
              <TableHead className="text-zinc-400">Variants</TableHead>
              <TableHead className="hidden w-44 text-zinc-400 xl:table-cell">Context</TableHead>
              <TableHead className="w-12 text-zinc-400"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <Fragment key={p.pmid}>
                <TableRow
                  className="cursor-pointer border-zinc-800/70 hover:bg-zinc-800/40"
                  onClick={() => setExpanded(expanded === p.pmid ? null : p.pmid)}
                >
                  <TableCell className="font-mono text-xs text-zinc-400">
                    {p.pubYear ?? "n/a"}
                  </TableCell>
                  <TableCell className="max-w-[420px]">
                    <p className="truncate text-sm font-medium text-zinc-200" title={p.title}>
                      {p.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500" title={p.authors}>
                      {p.authors || "Authors not indexed"}
                    </p>
                  </TableCell>
                  <TableCell className="hidden max-w-[180px] truncate text-xs text-zinc-400 lg:table-cell" title={p.journal}>
                    {p.journal || "n/a"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.variants.slice(0, 4).map((v) => (
                        <Badge
                          key={v}
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] font-semibold text-emerald-300"
                        >
                          {v}
                        </Badge>
                      ))}
                      {p.variants.length > 4 && (
                        <Badge variant="outline" className="border-zinc-700 text-[10px] text-zinc-400">
                          +{p.variants.length - 4}
                        </Badge>
                      )}
                      {p.variants.length === 0 && (
                        <span className="text-xs text-zinc-600">none detected</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(contextByPmid.get(p.pmid)?.etiology ?? []).slice(0, 2).map((label) => {
                        const style = ETIOLOGY_STYLES[label];
                        return (
                          <span
                            key={label}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
                              style?.badge ?? "border-zinc-700 bg-zinc-900 text-zinc-300",
                            )}
                            title={`Etiology context mentioned in the text: ${label}`}
                          >
                            {style?.dot && (
                              <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                            )}
                            {label}
                          </span>
                        );
                      })}
                      {(contextByPmid.get(p.pmid)?.etiology.length ?? 0) === 0 && (
                        <span className="text-[10px] text-zinc-600">none</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-zinc-500 transition-transform",
                        expanded === p.pmid && "rotate-180",
                      )}
                    />
                  </TableCell>
                </TableRow>
                {expanded === p.pmid && (
                  <TableRow className="border-zinc-800/70 hover:bg-zinc-900">
                    <TableCell
                      colSpan={6}
                      className="whitespace-normal bg-zinc-950/60 px-6 py-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-sm border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-emerald-300 transition-colors hover:border-emerald-500/40"
                          >
                            PMID {p.pmid} ↗
                          </a>
                          {p.doi && (
                            <span className="font-mono text-zinc-500">DOI: {p.doi}</span>
                          )}
                        </div>
                        <ContextDetails ctx={contextByPmid.get(p.pmid)} />
                        <div className="flex items-start gap-2">
                          <FileText className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                          <p className="text-sm leading-relaxed text-zinc-400">
                            {p.abstract
                              ? highlightVariants(p.abstract, p.variants)
                              : "No abstract available for this record."}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
            {filtered.length === 0 && (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <FileText className="h-6 w-6 opacity-40" />
                    <p className="text-sm">No papers match the current filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ContextDetails({ ctx }: { ctx: PaperContext | undefined }) {
  if (!ctx) return null;
  const groups: {
    title: string;
    labels: string[];
    badge: string;
    dot?: string;
  }[] = [
    {
      title: "Etiology mentioned",
      labels: ctx.etiology,
      badge: "border-zinc-700 bg-zinc-900 text-zinc-300",
      dot: undefined,
    },
    {
      title: "Diagnostics reported",
      labels: ctx.modalities,
      badge: MODALITY_BADGE,
    },
    {
      title: "Clinical features",
      labels: ctx.features,
      badge: FEATURE_BADGE,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2 rounded-md border border-zinc-800/80 bg-zinc-900/40 p-3 sm:grid-cols-3">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            {g.title}
          </p>
          {g.labels.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {g.labels.map((label) => {
                const style =
                  g.title === "Etiology mentioned" ? ETIOLOGY_STYLES[label] : undefined;
                return (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
                      style?.badge ?? g.badge,
                    )}
                  >
                    {(style?.dot ?? g.dot) && (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          style?.dot ?? g.dot,
                        )}
                      />
                    )}
                    {label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-zinc-600">not mentioned</p>
          )}
        </div>
      ))}
      <p className="text-[10px] leading-snug text-zinc-600 sm:col-span-3">
        Keyword-detected context from title + abstract: the text mentions these,
        it does not assert them. Etiology triad: sporadic / genetic / acquired.
      </p>
    </div>
  );
}
