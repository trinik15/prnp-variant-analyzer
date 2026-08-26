/**
 * GET /api/crosslinks — "Beyond PRNP" cross-field literature counts.
 *
 * The unification of scrapie, kuru, BSE and CJD into transmissible
 * spongiform encephalopathies — and the prion hypothesis itself — came
 * from connecting observations across disciplines. This endpoint makes
 * that cross-field view concrete: it reports live PubMed corpus sizes
 * for the neighbouring research spheres around PRNP.
 *
 * Count-only esearch calls (retmax=0), run sequentially with a small
 * delay to respect NCBI's 3 req/s guidance, cached in memory for an
 * hour so page visits don't hammer E-utilities.
 */

import { NextResponse } from "next/server";
import { pubmedSearch } from "@/lib/prion/pubmed";

interface CrosslinkTopic {
  id: string;
  label: string;
  blurb: string;
  term: string;
}

export interface CrosslinkResult extends CrosslinkTopic {
  /** Total papers on PubMed; null if the lookup failed. */
  count: number | null;
}

const TOPICS: CrosslinkTopic[] = [
  {
    id: "ffi",
    label: "Fatal familial insomnia",
    blurb:
      "D178N with 129M in cis: the insomnia-dominant familial disease that proved a single PRNP codon can rewrite a phenotype.",
    term: '"fatal familial insomnia"[tiab]',
  },
  {
    id: "vcjd-bse",
    label: "Variant CJD & BSE",
    blurb:
      "Mad cow → human vCJD: the acquired route, confirmed when infected beef tissue transmitted disease across species.",
    term:
      '"variant Creutzfeldt-Jakob"[tiab] OR "bovine spongiform encephalopathy"[tiab]',
  },
  {
    id: "kuru",
    label: "Kuru",
    blurb:
      "The Fore funerary-transmission epidemic, and the population where the protective G127V variant colocalizes.",
    term: "kuru[tiab]",
  },
  {
    id: "scrapie",
    label: "Scrapie",
    blurb:
      "The 1700s sheep disease that started it all: the original transmissible spongiform encephalopathy.",
    term: "scrapie[tiab]",
  },
  {
    id: "iatrogenic",
    label: "Iatrogenic CJD",
    blurb:
      "Prions survive formaldehyde, heat and standard sterilization; transmission via grafts, hormones and neurosurgery is documented.",
    term: '"iatrogenic Creutzfeldt-Jakob"[tiab]',
  },
  {
    id: "prion-like",
    label: "Prion-like propagation",
    blurb:
      "Amyloid-β, tau and α-synuclein seeding in Alzheimer's and Parkinson's: the prion concept spreading into neurodegeneration at large.",
    term:
      '"prion-like"[tiab] AND (alpha-synuclein[tiab] OR tau[tiab] OR amyloid-beta[tiab])',
  },
  {
    id: "yeast",
    label: "Yeast prions",
    blurb:
      "Sup35 and friends: proteins that misfold on purpose and help yeast survive stress. Prions as an evolutionary strategy.",
    term: '"yeast prion"[tiab] OR (Sup35[tiab] AND prion[tiab])',
  },
  {
    id: "rtquic-pmca",
    label: "RT-QuIC & PMCA",
    blurb:
      "The in-vitro amplification assays behind modern ante-mortem CSF diagnosis, detecting the misfolded protein itself.",
    term: '"RT-QuIC"[tiab] OR "protein misfolding cyclic amplification"[tiab]',
  },
];

const TTL_MS = 60 * 60 * 1000;
let cache: { at: number; data: CrosslinkResult[] } | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchCounts(): Promise<CrosslinkResult[]> {
  const out: CrosslinkResult[] = [];
  for (const topic of TOPICS) {
    try {
      const res = await pubmedSearch(topic.term, 0);
      out.push({ ...topic, count: res.total });
    } catch {
      out.push({ ...topic, count: null });
    }
    await sleep(140); // stay well under NCBI's 3 req/s without an API key
  }
  return out;
}

export async function GET() {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return NextResponse.json({ ok: true, cached: true, topics: cache.data });
  }
  const topics = await fetchCounts();
  if (topics.some((t) => t.count != null)) {
    cache = { at: Date.now(), data: topics };
  }
  return NextResponse.json({ ok: true, cached: false, topics });
}
