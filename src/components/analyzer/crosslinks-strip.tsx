"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Globe2, Loader2 } from "./icons";
import { Button } from "@/components/ui/button";

interface CrosslinkTopic {
  id: string;
  label: string;
  blurb: string;
  term: string;
  count: number | null;
}

interface CrosslinksResponse {
  ok: boolean;
  cached?: boolean;
  topics?: CrosslinkTopic[];
}

/**
 * "Beyond PRNP" — live PubMed corpus sizes for the research spheres that
 * surround the prion-protein literature. The unification of scrapie, kuru,
 * BSE and CJD into one disease family (and the prion hypothesis itself)
 * came from connecting observations across disciplines; this strip makes
 * that cross-field view concrete and one click runnable.
 */
export function CrosslinksStrip({
  onSearch,
}: {
  onSearch: (term: string) => void;
}) {
  const [topics, setTopics] = useState<CrosslinkTopic[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/crosslinks");
      const d: CrosslinksResponse = await res.json();
      if (d?.ok && Array.isArray(d.topics)) setTopics(d.topics);
    } catch {
      /* strip stays on skeletons; counts are a nice-to-have */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const fmt = (n: number) =>
    n >= 1000 ? n.toLocaleString("en-US") : String(n);

  return (
    <section
      aria-label="Related research fields"
      className="rounded-md border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-500/10">
          <Globe2 className="h-4 w-4 text-emerald-400" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
          Beyond PRNP: one connected field
        </h2>
        <span className="text-xs text-zinc-500">
          scrapie, kuru, BSE and CJD became one disease family because
          researchers connected observations across disciplines. Live PubMed
          corpus sizes for the fields around this tool.
        </span>
        {loading && (
          <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-emerald-400/70" />
        )}
        {!loading && topics && (
          <span className="ml-auto rounded-sm border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-[10px] text-zinc-500">
            counts live from NCBI esearch
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {(topics ?? Array.from({ length: 8 }).map((_, i) => null)).map(
          (t, i) =>
            t ? (
              <div
                key={t.id}
                className="group flex flex-col rounded-md border border-zinc-800 bg-zinc-900/70 p-3.5 transition-colors hover:border-emerald-500/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold leading-tight text-zinc-200">
                    {t.label}
                  </p>
                  <span className="shrink-0 font-mono text-[11px] font-bold text-emerald-300">
                    {t.count != null ? fmt(t.count) : "n/a"}
                  </span>
                </div>
                <p className="mt-1 flex-1 text-[11px] leading-snug text-zinc-500">
                  {t.blurb}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-zinc-800/80 pt-2.5">
                  <span className="font-mono text-[9px] text-zinc-600">
                    {t.count != null ? "papers on PubMed" : "count unavailable"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSearch(t.term)}
                    className="h-6 border-zinc-700 bg-zinc-950 px-2 text-[10px] font-semibold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300"
                  >
                    Analyze
                    <ArrowRight className="ml-1 h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                key={`sk-${i}`}
                className="flex flex-col rounded-md border border-zinc-800 bg-zinc-900/70 p-3.5"
              >
                <div className="h-4 w-28 animate-pulse rounded bg-zinc-800/80" />
                <div className="mt-2 flex-1 space-y-1.5">
                  <div className="h-2.5 w-full animate-pulse rounded bg-zinc-800/60" />
                  <div className="h-2.5 w-4/5 animate-pulse rounded bg-zinc-800/60" />
                </div>
                <div className="mt-3 h-5 w-full animate-pulse rounded bg-zinc-800/40" />
              </div>
            ),
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
        Each card runs its term through the full analyzer: the same pipeline,
        just pointed at a neighbouring field. Counts are cached for an hour so
        E-utilities stay rate-limit friendly.
      </p>
    </section>
  );
}
