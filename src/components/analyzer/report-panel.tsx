"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Download, FileCode2, RefreshCw } from "./icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { classificationStyle } from "./types";
import type { ReportRow } from "@/lib/prion/report";

interface ReportMeta {
  papers: number;
  variants: number;
  totalMentions: number;
  yearFrom: number | null;
  yearTo: number | null;
  generatedAt: string;
  source: string;
}

const MUTATION_TYPE_STYLES: Record<string, string> = {
  Missense: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  "Nonsense (stop)": "border-rose-500/30 bg-rose-500/10 text-rose-300",
  "Insertion (octapeptide repeat)": "border-amber-500/30 bg-amber-500/10 text-amber-300",
  "Deletion (octapeptide repeat)": "border-teal-500/30 bg-teal-500/10 text-teal-300",
};

export function ReportPanel({ hasData, onRefresh }: { hasData: boolean; onRefresh?: () => void }) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(hasData);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/report");
      const data = await res.json();
      if (data.ok) {
        setRows(data.rows);
        setMeta(data.meta);
        setMarkdown(data.markdown);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasData) void load();
  }, [hasData, load]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  if (!hasData) {
    return (
      <p className="rounded-md border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-500">
        Run an analysis first; the report summarizes the stored corpus.
      </p>
    );
  }

  const maxMentions = Math.max(1, ...rows.map((r) => r.mentions));

  return (
    <div className="space-y-4">
      {/* header card */}
      <div className="flex flex-col gap-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <FileCode2 className="h-4 w-4 text-emerald-400" />
            PRNP Variant Literature Frequency Report
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Markdown summary over the stored corpus:{" "}
            <span className="font-mono text-emerald-300">{meta?.papers ?? 0}</span> papers,{" "}
            <span className="font-mono text-emerald-300">{meta?.variants ?? 0}</span> variants,{" "}
            <span className="font-mono text-emerald-300">{meta?.totalMentions ?? 0}</span> total
            mentions
            {meta?.yearFrom && meta?.yearTo ? (
              <>
                {" "}
                · window <span className="font-mono text-zinc-300">{meta.yearFrom}–{meta.yearTo}</span>
              </>
            ) : null}
            . Mentions = textual occurrences in titles + abstracts.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
          >
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copy}
            className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
          >
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy .md"}
          </Button>
          <a href="/api/report?format=md" download>
            <Button size="sm" className="bg-emerald-500 font-semibold text-zinc-950 hover:bg-emerald-400">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download .md
            </Button>
          </a>
          {copyFailed && (
            <span className="text-xs text-rose-400">
              Clipboard unavailable; use Download .md instead.
            </span>
          )}
        </div>
      </div>

      {/* rendered summary table */}
      <div className="custom-scrollbar max-h-[460px] overflow-y-auto rounded-md border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-900">
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 font-medium">Mutation Type</th>
              <th className="px-4 py-3 text-right font-medium">Number of Mentions</th>
              <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Papers</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Class</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const style = classificationStyle(r.classification);
              return (
                <tr
                  key={r.notation}
                  className={cn(
                    "border-b border-zinc-800/60 transition-colors hover:bg-zinc-800/30",
                    i < 3 && "bg-emerald-500/[0.04]",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-sm font-bold text-emerald-300">{r.notation}</span>
                    {i === 0 && (
                      <Badge className="ml-2 border-0 bg-amber-500/15 text-[10px] font-semibold text-amber-300">
                        TOP
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant="outline"
                      className={cn("border text-[11px]", MUTATION_TYPE_STYLES[r.mutationType] ?? "border-zinc-700 text-zinc-300")}
                    >
                      {r.mutationType}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden h-1.5 w-24 overflow-hidden rounded-sm bg-zinc-800 sm:block">
                        <div
                          className="h-full rounded-sm bg-emerald-500/70"
                          style={{ width: `${(r.mentions / maxMentions) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm font-semibold text-zinc-100">{r.mentions}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-2.5 text-right font-mono text-xs text-zinc-400 md:table-cell">
                    {r.papers}
                  </td>
                  <td className="hidden px-4 py-2.5 lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className={cn("h-2 w-2 rounded-full", style.dot)} />
                      {r.classification}
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="h-24 text-center text-sm text-zinc-500">
                  No variants in the corpus yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* raw markdown toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="text-xs font-medium text-zinc-500 transition-colors hover:text-emerald-300"
          aria-expanded={showRaw}
        >
          {showRaw ? "▾ Hide raw markdown" : "▸ Show raw markdown"}
        </button>
        {showRaw && (
          <div className="custom-scrollbar mt-2 max-h-72 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-4">
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-zinc-300">
              {markdown}
            </pre>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-600">
        The downloadable standalone script (<code className="font-mono text-zinc-500">prnp_pubmed_variants.py</code>,
        Python tab) reproduces this exact table from a live PubMed query. Default: the 100 most
        recent papers mentioning &quot;Prion Protein Variant&quot; or &quot;PRNP mutation&quot;, with
        mention-frequency counting and markdown output.
      </p>
    </div>
  );
}
