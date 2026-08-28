"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Dna,
  Download,
  Github,
  Search,
  Sparkles,
  Upload,
} from "@/components/analyzer/icons";
import { Button } from "@/components/ui/button";
import { SearchPanel } from "@/components/analyzer/search-panel";
import { StatsCards } from "@/components/analyzer/stats-cards";
import { ChartsPanel } from "@/components/analyzer/charts-panel";
import { VariantsTable } from "@/components/analyzer/variants-table";
import { PapersTable } from "@/components/analyzer/papers-table";
import { ScriptPanel } from "@/components/analyzer/script-panel";
import { ReportPanel } from "@/components/analyzer/report-panel";
import { HeroShowcase } from "@/components/analyzer/hero-showcase";
import { PipelineStrip } from "@/components/analyzer/pipeline-strip";
import { Playground } from "@/components/analyzer/playground";
import { CrosslinksStrip } from "@/components/analyzer/crosslinks-strip";
import type {
  AnalyzeResponse,
  PaperDTO,
  SearchParams,
  StatsDTO,
  VariantDTO,
} from "@/components/analyzer/types";
import { cn } from "@/lib/utils";

const STAGED_MESSAGES = [
  "Querying PubMed E-utilities…",
  "Fetching abstracts & metadata…",
  "Scanning text for amino-acid variants…",
  "Matching against the curated knowledge base…",
  "Annotating evidence & provenance…",
  "Building the CSV & Markdown dataset…",
];

type TabKey = "variants" | "papers" | "report" | "script";

const TABS: { key: TabKey; label: string }[] = [
  { key: "variants", label: "Variants" },
  { key: "papers", label: "Papers" },
  { key: "report", label: "Report" },
  { key: "script", label: "Python script" },
];

/** Read ?term=&retmax=&from=&to= so a plain GET submit (or a shared link) runs the query. */
function paramsFromUrl(): SearchParams | null {
  if (typeof window === "undefined") return null;
  const qs = new URLSearchParams(window.location.search);
  const term = qs.get("term")?.trim();
  if (!term) return null;
  const retmax = Number(qs.get("retmax")) || 60;
  const mindate = qs.get("from")?.trim() || undefined;
  const maxdate = qs.get("to")?.trim() || undefined;
  return { term, retmax, mindate, maxdate };
}

export default function Home() {
  const [stats, setStats] = useState<StatsDTO | null>(null);
  const [variants, setVariants] = useState<VariantDTO[]>([]);
  const [papers, setPapers] = useState<PaperDTO[]>([]);
  const [searchMeta, setSearchMeta] = useState<AnalyzeResponse["search"] | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showcaseKey, setShowcaseKey] = useState(0);
  const [crosslinkTerm, setCrosslinkTerm] = useState<string | null>(null);
  const [urlSeed, setUrlSeed] = useState<SearchParams | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("variants");
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshLists = useCallback(async () => {
    const [vRes, pRes, sRes] = await Promise.all([
      fetch("/api/variants"),
      fetch("/api/papers"),
      fetch("/api/stats"),
    ]);
    const v = await vRes.json();
    const p = await pRes.json();
    const s = await sRes.json();
    if (v.ok) setVariants(v.variants);
    if (p.ok) setPapers(p.papers);
    if (s.ok) setStats(s.stats);
  }, []);

  const runAnalyze = useCallback(
    async (params: SearchParams) => {
      setAnalyzing(true);
      setError(null);
      setStage(0);
      stageTimer.current = setInterval(() => {
        setStage((s) => Math.min(s + 1, STAGED_MESSAGES.length - 1));
      }, 1400);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || `Analysis failed (HTTP ${res.status})`);
        }
        setVariants(data.variants);
        setPapers(data.papers);
        setStats(data.stats);
        setSearchMeta(data.search);
        setShowcaseKey((k) => k + 1); // re-pull the example-output showcase
        // Reflect the run in the address bar: every search becomes a shareable link.
        const qs = new URLSearchParams();
        qs.set("term", params.term);
        if (params.retmax && params.retmax !== 60) qs.set("retmax", String(params.retmax));
        if (params.mindate) qs.set("from", params.mindate);
        if (params.maxdate) qs.set("to", params.maxdate);
        window.history.replaceState(null, "", `/?${qs.toString()}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error during analysis.");
      } finally {
        if (stageTimer.current) clearInterval(stageTimer.current);
        stageTimer.current = null;
        setAnalyzing(false);
      }
    },
    [],
  );

  // Cross-field cards: run the term through the full pipeline and take the
  // user to the results section.
  const runCrosslink = useCallback(
    (term: string) => {
      setCrosslinkTerm(term);
      void runAnalyze({ term, retmax: 60 });
      document
        .getElementById("run-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [runAnalyze],
  );

  // Initial load: pull DB state; honor ?term= from the URL, auto-seed otherwise
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const urlParams = paramsFromUrl();
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (cancelled) return;
        if (urlParams) {
          setUrlSeed(urlParams);
          await runAnalyze(urlParams);
          await refreshLists();
        } else if (data.ok && data.stats.totalPapers > 0) {
          setStats(data.stats);
          await refreshLists();
        } else {
          await runAnalyze({ term: "PRNP mutation", retmax: 60 });
        }
      } catch {
        if (!cancelled) setError("Could not reach the analyzer API.");
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, []);

  const hasData = stats != null && stats.totalPapers > 0;

  const papersByPmid = useMemo(() => {
    const m = new Map<string, PaperDTO>();
    for (const p of papers) m.set(p.pmid, p);
    return m;
  }, [papers]);

  const panelInitialParams = crosslinkTerm
    ? { term: crosslinkTerm, retmax: 60 }
    : urlSeed ?? undefined;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-500/15">
            <Dna className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">
              PRNP Variant Analyzer
            </p>
            <p className="hidden text-[11px] text-zinc-500 sm:block">
              Open-source literature & variant mining for prion research
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-400 md:inline-block">
              NCBI PubMed · E-utilities
            </span>
            <a
              href="https://www.ncbi.nlm.nih.gov/books/NBK25500/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <Github className="h-3.5 w-3.5" />
              API docs
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero: short thesis, then the tool itself */}
        <div className="mb-6 max-w-3xl pt-2">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-sm border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            <Sparkles className="h-3 w-3" />
            Skip the thousand PDFs. Open source, research only
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-4xl">
            Run your first{" "}
            <span className="text-emerald-400">PRNP analysis</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Point it at PubMed and get a continuously queryable dataset: every reported
            variant (<span className="font-mono text-emerald-300">E200K</span>,{" "}
            <span className="font-mono text-emerald-300">D178N</span>,{" "}
            <span className="font-mono text-emerald-300">P102L</span>…) with its reported
            association, evidence provenance, and CSV + Markdown export. Not a
            classifier: cross-check every call against ClinVar.
          </p>
        </div>

        {/* The analyzer itself: the dominant first-screen action */}
        <div id="run-section" className="scroll-mt-20">
          <SearchPanel
            key={crosslinkTerm ?? urlSeed?.term ?? "default"}
            analyzing={analyzing}
            onSearch={runAnalyze}
            initialParams={panelInitialParams}
          />
        </div>

        {/* staged progress */}
        {analyzing && (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <p className="text-sm text-emerald-300">{STAGED_MESSAGES[stage]}</p>
          </div>
        )}

        {/* error */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-rose-300">Analysis error</p>
              <p className="mt-0.5 text-xs text-rose-200/70">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runAnalyze({ term: "PRNP mutation", retmax: 60 })}
                className="mt-2 h-7 border-rose-500/40 px-3 text-xs text-rose-200 hover:bg-rose-500/10"
              >
                <Search className="mr-1 h-3 w-3" /> Retry default query
              </Button>
            </div>
          </div>
        )}

        {/* initial skeleton */}
        {initialLoading && !hasData && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-md border border-zinc-800 bg-zinc-900/60" />
            ))}
          </div>
        )}

        {/* search summary */}
        {searchMeta && !analyzing && (
          <p className="mt-4 text-xs text-zinc-500">
            Latest run fetched{" "}
            <span className="font-mono text-emerald-300">{searchMeta.fetched}</span> of{" "}
            <span className="font-mono text-zinc-300">{searchMeta.totalOnPubmed}</span> total PubMed
            hits for <span className="font-mono text-zinc-300">&quot;{searchMeta.term}&quot;</span>;
            corpus totals shown below include every run stored in this instance.
          </p>
        )}

        {/* Stats + charts + tables */}
        {hasData && (
          <div id="results" className="mt-6 scroll-mt-20 space-y-6">
            <StatsCards stats={stats!} />
            <ChartsPanel stats={stats!} />

            <div className="w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="custom-scrollbar w-full overflow-x-auto pb-1 sm:w-auto sm:overflow-x-visible sm:pb-0">
                  <div className="inline-flex items-center gap-1 border border-zinc-800 bg-zinc-900 p-1" role="tablist" aria-label="Dataset views">
                    {TABS.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === t.key}
                        onClick={() => setActiveTab(t.key)}
                        className={cn(
                          "whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                          activeTab === t.key
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "text-zinc-400 hover:text-zinc-200",
                        )}
                      >
                        {t.label}
                        {t.key === "variants" && (
                          <span className="ml-1.5 font-mono text-xs text-zinc-500">{variants.length}</span>
                        )}
                        {t.key === "papers" && (
                          <span className="ml-1.5 font-mono text-xs text-zinc-500">{papers.length}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export buttons */}
                <div className="flex gap-2 sm:ml-auto">
                  <a href="/api/export?type=variants" download>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-emerald-500/40 hover:text-emerald-300"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Variants CSV
                    </Button>
                  </a>
                  <a href="/api/export?type=papers" download>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-emerald-500/40 hover:text-emerald-300"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Papers CSV
                    </Button>
                  </a>
                </div>
              </div>

              <div className="mt-4" role="tabpanel">
                {activeTab === "variants" && (
                  <VariantsTable variants={variants} papersByPmid={papersByPmid} />
                )}
                {activeTab === "papers" && <PapersTable papers={papers} />}
                {activeTab === "report" && <ReportPanel hasData={hasData} />}
                {activeTab === "script" && <ScriptPanel />}
              </div>
            </div>
          </div>
        )}

        {/* empty state */}
        {!initialLoading && !hasData && !analyzing && !error && (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-md border border-dashed border-zinc-800 py-16 text-center">
            <Upload className="h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-400">No corpus yet. Run an analysis above.</p>
          </div>
        )}

        {/* How it works: the pipeline is the explanation underneath the tool */}
        <div className="mb-8 mt-10 space-y-6">
          <PipelineStrip />
          <div id="live-example" className="scroll-mt-20">
            <HeroShowcase key={showcaseKey} />
          </div>
        </div>

        {/* Zero-setup playground: paste any text → structured variants */}
        <div className="mb-6">
          <Playground />
        </div>

        {/* Beyond-PRNP cross-field strip (live PubMed counts) */}
        <div className="mb-6">
          <CrosslinksStrip onSearch={runCrosslink} />
        </div>
      </main>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-xs text-zinc-500 sm:flex-row sm:px-6">
          <p>
            <span className="font-semibold text-zinc-400">© {new Date().getFullYear()} PRNP Variant Analyzer contributors</span>{" "}
            · MIT licensed · data from NCBI PubMed via public E-utilities ·{" "}
            <a
              href="/llms.txt"
              className="underline decoration-zinc-600 underline-offset-2 transition-colors hover:text-zinc-300"
            >
              llms.txt
            </a>{" "}
            ·{" "}
            <a
              href="/screenshots/home-desktop.png"
              className="underline decoration-zinc-600 underline-offset-2 transition-colors hover:text-zinc-300"
            >
              PNG snapshots
            </a>
          </p>
          <p className="text-center sm:text-right">
            Research use only, not a clinical tool. Evidence tiers describe reported
            literature associations; variant calls require validation against{" "}
            <span className="text-zinc-400">ClinVar</span>.
          </p>
        </div>
      </footer>
    </div>
  );
}
