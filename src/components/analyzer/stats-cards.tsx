"use client";

import { Dna, FileText, FlaskConical, ShieldAlert, History } from "./icons";
import type { StatsDTO } from "./types";

interface StatsCardsProps {
  stats: StatsDTO;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Papers analyzed",
      value: stats.totalPapers.toLocaleString(),
      icon: FileText,
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
      sub: `Total on PubMed: latest query`,
    },
    {
      label: "Unique PRNP variants",
      value: stats.totalVariants.toLocaleString(),
      icon: Dna,
      accent: "text-teal-400",
      bg: "bg-teal-500/10",
      sub: `Corpus span: ${stats.yearsCovered}`,
    },
    {
      label: "Pathogenic (per literature)",
      value: stats.pathogenicCount.toLocaleString(),
      icon: ShieldAlert,
      accent: "text-rose-400",
      bg: "bg-rose-500/10",
      sub: `${stats.unclassifiedCount} unannotated; cross-check ClinVar`,
    },
    {
      label: "Last query",
      value: stats.lastSearch ? stats.lastSearch.term.slice(0, 24) : "none",
      icon: History,
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
      sub: stats.lastSearch
        ? `${stats.lastSearch.papersFound} papers · ${new Date(stats.lastSearch.createdAt).toLocaleDateString()}`
        : "Run your first analysis",
      mono: true,
    },
  ];

  return (
    <section aria-label="Corpus statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="group rounded-md border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 sm:p-5"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{c.label}</p>
              <p
                className={`mt-2 truncate text-2xl font-bold text-zinc-100 ${c.mono ? "font-mono text-xl" : ""}`}
                title={c.mono ? c.value : undefined}
              >
                {c.value}
              </p>
              <p className="mt-1.5 truncate text-xs text-zinc-500">{c.sub}</p>
            </div>
            <div className={`rounded-sm p-2.5 ${c.bg}`}>
              <c.icon className={`h-5 w-5 ${c.accent}`} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

export function FlaskIcon() {
  return <FlaskConical className="h-4 w-4" />;
}
