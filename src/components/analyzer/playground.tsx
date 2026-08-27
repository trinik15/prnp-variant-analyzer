"use client";

import { useCallback, useState } from "react";
import {
  Eraser,
  FlaskConical,
  Loader2,
  Play,
  Sparkles,
  TextQuote,
} from "./icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  EVIDENCE_TIER_STYLES,
  clinvarUrl,
  type EvidenceTier,
} from "@/lib/prion/evidence";
import {
  ETIOLOGY_STYLES,
  FEATURE_BADGE,
  MODALITY_BADGE,
  type PaperContext,
} from "@/lib/prion/context";
import { cn } from "@/lib/utils";

interface ExtractVariant {
  notation: string;
  position: number;
  variantTypeLabel: string;
  domain: string;
  mentions: number;
  classification: string;
  disease: string;
  description: string;
  evidence: {
    tier: string;
    label: string;
    detail: string;
    provenance: string[];
  };
}

interface ExtractResult {
  ok: boolean;
  chars: number;
  truncated?: boolean;
  context: PaperContext;
  variants: ExtractVariant[];
}

/**
 * Synthetic demo text — deliberately engineered to exercise the whole
 * pipeline: one-letter + three-letter notations for the same variant,
 * the codon-129 story, out-of-window lookalikes (SARS-CoV-2 / flu),
 * diagnostic modalities and clinical features.
 */
const DEMO_TEXT = `Patient carried a heterozygous E200K mutation in PRNP (also written Glu200Lys),
consistent with familial Creutzfeldt-Jakob disease. The D178N substitution was
absent; M129V polymorphism status was 129MV; family history included P102L (GSS).
Unlike SARS-CoV-2 spike mutations D614G and N501Y, or influenza H274Y, PRNP
substitutions map to codons 40-243 and are retained by the codon-window guard.
CSF 14-3-3 was positive and RT-QuIC detected seeding activity; MRI showed basal
ganglia hyperintensity on diffusion-weighted imaging. The course was rapidly
progressive dementia with myoclonus and ataxia. Screening for an octapeptide
repeat insertion (2-OPRI) was negative.`;

export function Playground() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceTag, setSourceTag] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Extraction failed (HTTP ${res.status})`);
      }
      setResult(data as ExtractResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, [text, busy]);

  const loadRealAbstract = useCallback(async () => {
    setSourceTag(null);
    try {
      const res = await fetch("/api/showcase");
      const d = await res.json();
      const segs = d?.sampleAbstract?.segments as { t: string }[] | undefined;
      if (Array.isArray(segs) && segs.length > 0) {
        setText(segs.map((s) => s.t).join(""));
        setSourceTag(
          `real corpus abstract · PMID ${d.sampleAbstract.pmid}`,
        );
        setResult(null);
        return;
      }
    } catch {
      /* fall through to demo */
    }
    setText(DEMO_TEXT);
    setSourceTag("demo snippet (synthetic)");
  }, []);

  const clear = useCallback(() => {
    setText("");
    setResult(null);
    setError(null);
    setSourceTag(null);
  }, []);

  const ctx = result?.context;

  return (
    <section
      aria-label="Zero-setup extraction playground"
      className="rounded-md border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6"
    >
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
            <FlaskConical className="h-3.5 w-3.5" />
            Zero-setup playground
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-50 sm:text-xl">
            Paste any text. Watch it become structured data
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            The exact same extraction engine as the corpus pipeline (regex
            scanners, codon-window guard, knowledge-base match, evidence tiers),
            running right here. No PubMed query, no database write.
          </p>
        </div>
      </div>

      {/* input */}
      <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <TextQuote className="h-4 w-4 text-zinc-500" />
          <span className="text-xs text-zinc-500">
            {text.trim() ? `${text.length.toLocaleString()} characters` : "abstract, case report, review paragraph…"}
          </span>
          {sourceTag && (
            <span className="rounded-sm border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
              {sourceTag}
            </span>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadRealAbstract}
              className="h-7 border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              Load real abstract
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setText(DEMO_TEXT);
                setSourceTag("demo snippet (synthetic)");
                setResult(null);
                setError(null);
              }}
              className="h-7 border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300"
            >
              Demo snippet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="h-7 border-zinc-700 bg-zinc-900 px-2.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <Eraser className="mr-1.5 h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={12000}
          spellCheck={false}
          placeholder="Paste an abstract, a case description or any paragraph mentioning PRNP variants, e.g. 'the proband carried a heterozygous E200K mutation…'"
          className="custom-scrollbar resize-y border-zinc-800 bg-zinc-950 font-mono text-[13px] leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-emerald-500/30"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            onClick={run}
            disabled={busy || !text.trim()}
            className="h-9 bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
          >
            {busy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-1.5 h-4 w-4" />
            )}
            {busy ? "Extracting…" : "Extract variants"}
          </Button>
          <p className="text-[11px] text-zinc-600">
            deterministic · inspectable · nothing is stored
          </p>
        </div>
        {error && (
          <p className="mt-3 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error}
          </p>
        )}
      </div>

      {/* results */}
      {result && (
        <div className="mt-4 space-y-4">
          {/* clinical context */}
          <div className="rounded-md border border-zinc-800 bg-zinc-950/80 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              Clinical context detected in the text
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ContextGroup
                title="Etiology mentioned"
                labels={ctx?.etiology ?? []}
                styleFor={(l) => ETIOLOGY_STYLES[l]}
                fallback="none of the triad keywords"
              />
              <ContextGroup
                title="Diagnostics reported"
                labels={ctx?.modalities ?? []}
                styleFor={() => ({ badge: MODALITY_BADGE })}
                fallback="no assay keywords"
              />
              <ContextGroup
                title="Clinical features"
                labels={ctx?.features ?? []}
                styleFor={() => ({ badge: FEATURE_BADGE })}
                fallback="no feature keywords"
              />
            </div>
          </div>

          {/* variant table */}
          <div className="rounded-md border border-zinc-800 bg-zinc-950/80 p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              Structured output: {result.variants.length} variant
              {result.variants.length === 1 ? "" : "s"} detected
            </p>
            {result.variants.length > 0 ? (
              <div className="custom-scrollbar overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                      <th className="pb-2 pr-3 font-semibold">Variant</th>
                      <th className="pb-2 pr-3 font-semibold">Codon · domain</th>
                      <th className="pb-2 pr-3 font-semibold">Type</th>
                      <th className="pb-2 pr-3 font-semibold">Mentions</th>
                      <th className="pb-2 pr-3 font-semibold">Reported association</th>
                      <th className="pb-2 font-semibold">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.variants.map((v) => {
                      const style =
                        EVIDENCE_TIER_STYLES[v.evidence.tier as EvidenceTier] ??
                        EVIDENCE_TIER_STYLES.reported;
                      return (
                        <tr
                          key={v.notation}
                          className="border-b border-zinc-800/50 align-top last:border-0 hover:bg-zinc-900/60"
                        >
                          <td className="py-2.5 pr-3">
                            <span className="font-mono text-[13px] font-bold text-emerald-300">
                              {v.notation}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-zinc-400">
                            <span className="font-mono">{v.position}</span>
                            <span className="block text-[10px] text-zinc-600">
                              {v.domain}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-zinc-400">
                            {v.variantTypeLabel}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="font-mono text-xs text-zinc-300">
                              {v.mentions}
                            </span>
                          </td>
                          <td className="max-w-[240px] py-2.5 pr-3 text-xs text-zinc-400">
                            {v.disease || "none reported"}
                            <span className="block text-[10px] text-zinc-600">
                              {v.classification}
                            </span>
                          </td>
                          <td className="max-w-[200px] py-2.5">
                            <span
                              className={cn(
                                "inline-block cursor-help rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                                style.badge,
                              )}
                              title={`${v.evidence.detail}\n\nProvenance:\n${v.evidence.provenance.map((p) => `• ${p}`).join("\n")}`}
                            >
                              {v.evidence.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">
                No PRNP variants detected in this text. Try text mentioning{" "}
                <span className="font-mono text-emerald-300">E200K</span>,{" "}
                <span className="font-mono text-emerald-300">D178N</span> or{" "}
                <span className="font-mono text-emerald-300">OPRI</span>, or load
                an example above.
              </p>
            )}

            <p className="mt-2 text-[10px] text-zinc-600">
              Mentions are counted per textual occurrence; evidence tiers describe
              what the literature reports per variant. Cross-check{" "}
              <a
                href={clinvarUrl("PRNP")}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-zinc-700 underline-offset-2 hover:text-emerald-300"
              >
                ClinVar
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ContextGroup({
  title,
  labels,
  styleFor,
  fallback,
}: {
  title: string;
  labels: string[];
  styleFor: (label: string) => { badge: string; dot?: string } | undefined;
  fallback: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
        {title}
      </p>
      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {labels.map((l) => (
            <span
              key={l}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                styleFor(l)?.badge ?? "border-zinc-700 bg-zinc-900 text-zinc-300",
              )}
            >
              {styleFor(l)?.dot && (
                <span className={cn("h-1.5 w-1.5 rounded-full", styleFor(l)?.dot)} />
              )}
              {l}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-zinc-600">{fallback}</p>
      )}
    </div>
  );
}
