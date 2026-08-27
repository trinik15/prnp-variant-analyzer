"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Braces,
  CircleAlert,
  FileSpreadsheet,
  FlaskConical,
} from "./icons";
import {
  EVIDENCE_TIER_STYLES,
  clinvarUrl,
  type EvidenceTier,
} from "@/lib/prion/evidence";
import { cn } from "@/lib/utils";

interface ShowcaseRow {
  notation: string;
  classification: string;
  syndrome: string;
  tier: EvidenceTier;
  evidenceLabel: string;
  evidenceDetail: string;
  provenance: string[];
  pmid: string;
  paperTitle: string;
  journal: string;
  year: number | null;
}

interface Segment {
  t: string;
  v: boolean;
}

interface ShowcaseData {
  ok: boolean;
  source: "live" | "fallback";
  meta: { papers: number; variants: number; generatedAt: string };
  rows: ShowcaseRow[];
  sampleAbstract: {
    pmid: string;
    journal: string;
    year: number | null;
    notations: string[];
    segments: Segment[];
  } | null;
  csvPreview: { header: string[]; rows: string[][] };
  markdownPreview: string | null;
}

const TIER_LEGEND: { tier: EvidenceTier; text: string }[] = [
  { tier: "curated", text: "Disease association reported in literature" },
  { tier: "functional", text: "Functional / experimental evidence" },
  { tier: "population", text: "Population-level association" },
  { tier: "reported", text: "Machine-detected, not yet annotated" },
];

export function HeroShowcase() {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/showcase");
      const d = await res.json();
      if (d?.ok) {
        setData(d as ShowcaseData);
        return d as ShowcaseData;
      }
    } catch {
      /* endpoint hiccup — the showcase simply stays on its skeleton */
    }
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    (async () => {
      let d = await load();
      // corpus may still be auto-seeding — retry until we get live data
      while (!cancelled && d && d.source === "fallback" && retries < 3) {
        retries += 1;
        await new Promise((r) => setTimeout(r, 3500));
        d = await load();
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const isLive = data?.source === "live" && data.meta.papers > 0;

  return (
    <section
      aria-label="Example analyzer output"
      className="rounded-md border border-emerald-500/15 bg-zinc-900/60 p-4 sm:p-6"
    >
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
            <FlaskConical className="h-3.5 w-3.5" />
            Live example output
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-50 sm:text-xl">
            What you get when you click{" "}
            <span className="text-emerald-300">Analyze</span>
          </h2>
        </div>
        <div className="sm:ml-auto">
          {loading || !data ? (
            <span className="inline-flex items-center gap-2 rounded-sm border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              loading corpus…
            </span>
          ) : isLive ? (
            <span className="inline-flex items-center gap-2 rounded-sm border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              this instance: {data.meta.papers} papers · {data.meta.variants} variants
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-sm border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
              landmark examples; seeding corpus…
            </span>
          )}
        </div>
      </div>

      {/* before / after */}
      <div className="mt-5 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,5fr)_auto_minmax(0,7fr)]">
        {/* BEFORE: messy literature */}
        <div className="flex min-w-0 flex-col rounded-md border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Input: the literature
            </p>
            {data?.sampleAbstract && (
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/${data.sampleAbstract.pmid}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-mono text-[10px] text-zinc-500 transition-colors hover:text-emerald-300"
              >
                PMID {data.sampleAbstract.pmid} ↗
              </a>
            )}
          </div>
          {data?.sampleAbstract ? (
            <>
              <p className="mb-2 text-xs text-zinc-500">
                {data.sampleAbstract.journal}
                {data.sampleAbstract.year ? ` · ${data.sampleAbstract.year}` : ""}.
                Abstract, verbatim:
              </p>
              <p className="text-[13px] leading-relaxed text-zinc-400">
                {data.sampleAbstract.segments.map((seg, i) =>
                  seg.v ? (
                    <mark
                      key={i}
                      className="rounded bg-emerald-500/15 px-0.5 font-mono text-[12px] font-semibold text-emerald-300"
                    >
                      {seg.t}
                    </mark>
                  ) : (
                    <span key={i}>{seg.t}</span>
                  ),
                )}
              </p>
            </>
          ) : (
            <div className="flex-1 space-y-2.5 py-1">
              {[92, 100, 96, 88, 100, 72].map((w, i) => (
                <div
                  key={i}
                  className="h-2.5 animate-pulse rounded bg-zinc-800/80"
                  style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
                />
              ))}
              <p className="pt-1 text-[11px] text-zinc-600">
                A wall of abstracts lands here the moment the corpus is seeded.
              </p>
            </div>
          )}
          <p className="mt-3 border-t border-zinc-800/80 pt-2.5 text-[11px] text-zinc-600">
            Reading 100 abstracts by hand ≈ 2–3 h. The pipeline below does it in
            seconds, reproducibly.
          </p>
        </div>

        {/* arrow */}
        <div className="flex items-center justify-center lg:flex-col" aria-hidden="true">
          <ArrowRight className="hidden h-5 w-5 text-emerald-500/50 lg:block" />
          <ArrowDown className="h-5 w-5 text-emerald-500/50 lg:hidden" />
        </div>

        {/* AFTER: structured dataset */}
        <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            Output: the structured variant/evidence dataset
          </p>
          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="pb-2 pr-3 font-semibold">Variant</th>
                  <th className="pb-2 pr-3 font-semibold">Paper</th>
                  <th className="pb-2 pr-3 font-semibold">Syndrome reported</th>
                  <th className="pb-2 pr-3 font-semibold">Evidence</th>
                  <th className="pb-2 font-semibold">PMID</th>
                </tr>
              </thead>
              <tbody>
                {(data?.rows ?? []).map((r) => {
                  const style = EVIDENCE_TIER_STYLES[r.tier] ?? EVIDENCE_TIER_STYLES.reported;
                  return (
                    <tr
                      key={r.notation}
                      className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-900/60"
                    >
                      <td className="py-2 pr-3 align-top">
                        <span className="font-mono text-[13px] font-bold text-emerald-300">
                          {r.notation}
                        </span>
                      </td>
                      <td className="max-w-[210px] py-2 pr-3 align-top">
                        <p
                          className="truncate text-xs text-zinc-300"
                          title={r.paperTitle}
                        >
                          {r.paperTitle}
                        </p>
                        <p className="text-[10px] text-zinc-600">
                          {r.journal}
                          {r.year ? ` · ${r.year}` : ""}
                        </p>
                      </td>
                      <td className="py-2 pr-3 align-top text-xs text-zinc-400">
                        {r.syndrome}
                      </td>
                      <td className="max-w-[190px] py-2 pr-3 align-top">
                        <span
                          className={cn(
                            "inline-block cursor-help rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                            style.badge,
                          )}
                          title={`${r.evidenceDetail}\n\nProvenance:\n${r.provenance.map((p) => `• ${p}`).join("\n")}`}
                        >
                          {r.evidenceLabel}
                        </span>
                      </td>
                      <td className="py-2 align-top">
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-emerald-300"
                        >
                          {r.pmid}
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {!data &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`}>
                      <td colSpan={5} className="py-2">
                        <div
                          className="h-5 animate-pulse rounded bg-zinc-800/60"
                          style={{ width: `${60 + ((i * 13) % 35)}%` }}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-zinc-800/80 pt-2.5 text-[10px] text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <CircleAlert className="h-3 w-3" />
              tiers describe what the literature reports, not clinical validation
            </span>
            <a
              href={clinvarUrl("PRNP")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 underline decoration-zinc-700 underline-offset-2 transition-colors hover:text-emerald-300"
            >
              cross-check ClinVar ↗
            </a>
          </p>
        </div>
      </div>

      {/* exports preview */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* CSV structure */}
        <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-teal-400" />
            <p className="text-xs font-semibold text-zinc-200">
              Export structure: variants CSV
            </p>
            <span className="ml-auto font-mono text-[10px] text-zinc-600">
              /api/export?type=variants
            </span>
          </div>
          <pre className="custom-scrollbar overflow-x-auto rounded-sm border border-zinc-800/80 bg-zinc-950 p-3 font-mono text-[10.5px] leading-relaxed text-zinc-400">
            <span className="text-emerald-300">{data?.csvPreview.header.join(",") ?? "…"}</span>
            {"\n"}
            {(data?.csvPreview.rows ?? []).map((row, i) => (
              <span key={i} className="block whitespace-nowrap text-zinc-500">
                {row.join(",")}
              </span>
            ))}
          </pre>
          <p className="mt-2 text-[11px] text-zinc-600">
            Papers CSV too (pmid, journal, title, doi, variants detected, PubMed URL);
            download buttons live in the dataset section below.
          </p>
        </div>

        {/* Markdown frequency report */}
        <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <Braces className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-semibold text-zinc-200">
              Frequency report: literature mentions per variant
            </p>
            <span className="ml-auto font-mono text-[10px] text-zinc-600">
              Report tab · .md
            </span>
          </div>
          {data?.markdownPreview ? (
            <pre className="custom-scrollbar overflow-x-auto rounded-sm border border-zinc-800/80 bg-zinc-950 p-3 font-mono text-[10.5px] leading-relaxed text-zinc-400">
              {data.markdownPreview}
            </pre>
          ) : (
            <div className="space-y-2 rounded-sm border border-zinc-800/80 bg-zinc-950 p-3">
              <p className="font-mono text-[10.5px] text-emerald-300">
                | Variant | Mutation Type | Number of Mentions |
              </p>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 animate-pulse rounded bg-zinc-800/60"
                  style={{ width: `${45 + ((i * 17) % 30)}%` }}
                />
              ))}
              <p className="pt-1 text-[11px] text-zinc-600">
                Counts appear as soon as the corpus is seeded.
              </p>
            </div>
          )}
          <p className="mt-2 text-[11px] text-zinc-600">
            Every textual mention across titles + abstracts is counted (same table
            the bundled Python script prints).
          </p>
        </div>
      </div>

      {/* tier legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-zinc-800/70 bg-zinc-950/60 px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Evidence tiers
        </span>
        {TIER_LEGEND.map((l) => (
          <span key={l.tier} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className={cn("h-2 w-2 rounded-full", EVIDENCE_TIER_STYLES[l.tier].dot)} />
            {l.text}
          </span>
        ))}
      </div>
    </section>
  );
}
