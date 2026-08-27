"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Terminal } from "./icons";
import { Button } from "@/components/ui/button";

const SCRIPT_URL = "/scripts/prnp_pubmed_variants.py";

export function ScriptPanel() {
  const [code, setCode] = useState<string>("// loading script…");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(SCRIPT_URL)
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setCode(t);
      })
      .catch(() => {
        if (!cancelled) setCode("# Failed to load script. Download it instead.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Terminal className="h-4 w-4 text-emerald-400" />
            prnp_pubmed_variants.py
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            Production-ready community version. Pulls the{" "}
            <span className="text-emerald-300">100 most recent</span> peer-reviewed papers mentioning
            &quot;Prion Protein Variant&quot; or &quot;PRNP mutation&quot; via Entrez, parses
            variant notations, counts literature frequency, and prints a{" "}
            <span className="text-emerald-300">markdown summary table</span>. Run locally:{" "}
            <code className="rounded-sm bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300">
              pip install biopython && python prnp_pubmed_variants.py --md report.md
            </code>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copy}
            className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-emerald-300"
          >
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <a href={SCRIPT_URL} download>
            <Button
              size="sm"
              className="bg-emerald-500 font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download .py
            </Button>
          </a>
          {copyFailed && (
            <span className="self-center text-xs text-rose-400">
              Clipboard unavailable; use Download .py instead.
            </span>
          )}
        </div>
      </div>

      <div className="custom-scrollbar max-h-[520px] overflow-auto rounded-md border border-zinc-800 bg-zinc-950">
        <pre className="min-w-max px-4 py-4 text-[12px] leading-relaxed text-zinc-300">
          <code>{code}</code>
        </pre>
      </div>
      <p className="text-xs text-zinc-600">
        MIT licensed. Set <code className="font-mono text-zinc-500">Entrez.email</code> to your own
        address and respect NCBI&apos;s 3 req/sec rate limit. Not a clinical tool.
      </p>
    </div>
  );
}
