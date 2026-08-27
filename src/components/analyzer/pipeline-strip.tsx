"use client";

import {
  BadgeCheck,
  Crosshair,
  Database,
  Download,
  FileText,
  Search,
  Shuffle,
  Workflow,
} from "./icons";

const STEPS = [
  {
    title: "Query PubMed",
    detail: "esearch.fcgi via public E-utilities (no API key)",
    icon: Search,
  },
  {
    title: "Retrieve papers",
    detail: "efetch.fcgi pulls title, abstract and metadata per record",
    icon: FileText,
  },
  {
    title: "Detect variants",
    detail: "Regex scanners: E200K · Glu200Lys · OPRI/OPRD",
    icon: Crosshair,
  },
  {
    title: "Normalize",
    detail: "3-letter → 1-letter codes; codon window 40–243 validated",
    icon: Shuffle,
  },
  {
    title: "Match KB",
    detail: "~45 curated PRNP entries (ClinVar / UniProt / literature)",
    icon: Database,
  },
  {
    title: "Annotate evidence",
    detail: "Reported association + evidence tier + provenance",
    icon: BadgeCheck,
  },
  {
    title: "Export",
    detail: "CSV + Markdown via /api/export, or grab the Python script",
    icon: Download,
  },
] as const;

export function PipelineStrip() {
  return (
    <section aria-label="Analysis pipeline" className="rounded-md border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-emerald-500/10">
          <Workflow className="h-4 w-4 text-emerald-400" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
          The pipeline, end to end
        </h2>
        <span className="text-xs text-zinc-500">
          every step is deterministic and inspectable. No black box.
        </span>
      </div>

      <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-7">
        {STEPS.map((step, i) => {
          const isLast = i === STEPS.length - 1;
          return (
            <li
              key={step.title}
              className="group relative rounded-md border border-zinc-800 bg-zinc-900/70 p-3 transition-colors hover:border-emerald-500/30"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-700/80 bg-zinc-950 font-mono text-[10px] font-bold text-emerald-400">
                  {i + 1}
                </span>
                <step.icon className="h-3.5 w-3.5 text-zinc-500 transition-colors group-hover:text-emerald-400" />
                <span
                  className="ml-auto font-mono text-[9px] text-zinc-700 transition-colors group-hover:text-emerald-500/60"
                  aria-hidden="true"
                >
                  {isLast ? "✓" : "→"}
                </span>
              </div>
              <p className="mt-2 text-[13px] font-semibold leading-tight text-zinc-200">
                {step.title}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-zinc-500">{step.detail}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
