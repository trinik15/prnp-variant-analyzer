"use client";

import { useState } from "react";
import { Loader2, Microscope, Search, SlidersHorizontal, ChevronDown } from "./icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRESET_QUERIES, type SearchParams } from "./types";
import { cn } from "@/lib/utils";

interface SearchPanelProps {
  analyzing: boolean;
  onSearch: (params: SearchParams) => void;
  /** Initial values injected by external triggers (cross-field cards, ?term= links). */
  initialParams?: { term: string; retmax?: number; mindate?: string; maxdate?: string };
}

export function SearchPanel({ analyzing, onSearch, initialParams }: SearchPanelProps) {
  const [term, setTerm] = useState(initialParams?.term ?? "PRNP mutation");
  const [retmax, setRetmax] = useState(String(initialParams?.retmax ?? 60));
  const [mindate, setMindate] = useState(initialParams?.mindate ?? "");
  const [maxdate, setMaxdate] = useState(initialParams?.maxdate ?? "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const submit = (overrideTerm?: string) => {
    const t = (overrideTerm ?? term).trim();
    if (!t || analyzing) return;
    setTerm(t);
    onSearch({
      term: t,
      retmax: Number(retmax) || 60,
      mindate: mindate.trim() || undefined,
      maxdate: maxdate.trim() || undefined,
    });
  };

  return (
    <section
      aria-label="PubMed literature search"
      className="rounded-md border border-zinc-800 bg-zinc-900 p-4 sm:p-6"
    >
      {/* preset chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium uppercase tracking-widest text-zinc-500">
          Presets
        </span>
        {PRESET_QUERIES.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={analyzing}
            onClick={() => submit(preset.term)}
            className={cn(
              "rounded-sm border px-3 py-1 text-xs font-medium transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              term === preset.term
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-300",
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* search bar: a real GET form. With JS it runs the client pipeline;
          without JS it still submits the query to / which reads ?term= */}
      <form
        action="/"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            id="term-input"
            name="term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder='e.g. PRNP mutation, "fatal familial insomnia", PRNP AND E200K'
            aria-label="PubMed search query"
            className="h-12 border-zinc-700 bg-zinc-950 pl-10 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/40"
          />
        </div>
        <Button
          type="submit"
          disabled={analyzing || !term.trim()}
          className="h-12 min-w-[170px] bg-emerald-500 px-6 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Microscope className="mr-2 h-4 w-4" />
              Analyze literature
            </>
          )}
        </Button>
      </form>

      {/* advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-emerald-300"
        aria-expanded={showAdvanced}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Advanced filters
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180")}
        />
      </button>

      {showAdvanced && (
        <div className="mt-3 grid grid-cols-1 gap-4 rounded-md border border-zinc-800 bg-zinc-950 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="retmax" className="text-xs text-zinc-400">
              Max records
            </Label>
            <select
              id="retmax"
              name="retmax"
              value={retmax}
              onChange={(e) => setRetmax(e.target.value)}
              className="h-9 w-full rounded-sm border border-zinc-700 bg-zinc-900 px-2.5 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              {[25, 50, 60, 100, 150, 200].map((n) => (
                <option key={n} value={String(n)}>
                  {n} papers
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mindate" className="text-xs text-zinc-400">
              From year (optional)
            </Label>
            <Input
              id="mindate"
              name="from"
              value={mindate}
              onChange={(e) => setMindate(e.target.value)}
              placeholder="e.g. 2015"
              inputMode="numeric"
              maxLength={4}
              className="border-zinc-700 bg-zinc-950 font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxdate" className="text-xs text-zinc-400">
              To year (optional)
            </Label>
            <Input
              id="maxdate"
              name="to"
              value={maxdate}
              onChange={(e) => setMaxdate(e.target.value)}
              placeholder="e.g. 2025"
              inputMode="numeric"
              maxLength={4}
              className="border-zinc-700 bg-zinc-950 font-mono text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
        </div>
      )}
    </section>
  );
}
