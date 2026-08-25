/**
 * Clinical context detection — deterministic keyword scanning of
 * title + abstract text.
 *
 * Inspired by the diagnostic reasoning documented in clinical case
 * literature on prion disease:
 *
 *   1. ETIOLOGY — the recognised triad of prion-disease origins:
 *        sporadic (no PRNP mutation, cause unknown),
 *        genetic / familial (inherited PRNP variants — this tool's core),
 *        acquired (iatrogenic transmission, dietary/ritual exposure).
 *
 *   2. DIAGNOSTICS — the modalities a paper reports using
 *        (CSF 14-3-3, RT-QuIC / PMCA amplification assays, MRI/DWI,
 *         EEG, neuropathology, PRNP sequencing).
 *
 *   3. FEATURES — hallmark clinical signs (myoclonus, ataxia,
 *        rapidly progressive dementia, insomnia, psychiatric symptoms).
 *
 * Design rules, consistent with the rest of the analyzer:
 *   - every rule is an inspectable regex — no black box, no model;
 *   - detections are reported as "the text mentions", never as facts
 *     asserted by the tool;
 *   - multiple etiology labels can co-occur (papers often contrast
 *     sporadic vs familial cohorts).
 */

export interface PaperContext {
  etiology: string[];
  modalities: string[];
  features: string[];
}

export const ETIOLOGY_LABELS = {
  genetic: "Genetic / familial",
  sporadic: "Sporadic",
  iatrogenic: "Acquired (iatrogenic)",
  dietary: "Acquired (dietary/ritual)",
} as const;

/** Badge classes keyed by etiology label (no blue/indigo anywhere). */
export const ETIOLOGY_STYLES: Record<string, { badge: string; dot: string }> = {
  "Genetic / familial": {
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  Sporadic: {
    badge: "border-zinc-600/50 bg-zinc-500/10 text-zinc-300",
    dot: "bg-zinc-400",
  },
  "Acquired (iatrogenic)": {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  "Acquired (dietary/ritual)": {
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
  },
};

export const MODALITY_BADGE = "border-teal-500/30 bg-teal-500/10 text-teal-300";
export const FEATURE_BADGE = "border-zinc-700 bg-zinc-900 text-zinc-300";

interface Rule {
  label: string;
  re: RegExp;
}

const ETIOLOGY_RULES: Rule[] = [
  {
    label: ETIOLOGY_LABELS.genetic,
    re: /\bfamilial\b|\bhereditar(y|ian)\b|\binherited\b|autosomal[\s-]dominant|\bkindred\b|\bpenetrance\b|mutation\s+carrier|\bgermline\b/i,
  },
  {
    label: ETIOLOGY_LABELS.sporadic,
    re: /\bsporadic\b|\bsCJD\b/i,
  },
  {
    label: ETIOLOGY_LABELS.iatrogenic,
    re: /\biatrogenic\b|dural[\s-]graft|dura\s+mater\s+graft|cadaveric\s+(dura|growth\s*hormone)|human\s+pituitary\s+growth\s+hormone|\bgrowth\s+hormone\b|corneal\s+graft|surgical\s+(instrument|contamination)|depth\s+electrode/i,
  },
  {
    label: ETIOLOGY_LABELS.dietary,
    re: /\bkuru\b|\bbovine\s+spongiform\b|\bBSE\b|mad\s+cow|\bvCJD\b|variant\s+Creutzfeldt|cannibal/i,
  },
];

const MODALITY_RULES: Rule[] = [
  { label: "CSF 14-3-3", re: /\b14-?3-?3\b/i },
  { label: "RT-QuIC", re: /\bRT-?QuIC\b|real-?time\s+quaking/i },
  { label: "PMCA", re: /\bPMCA\b|protein\s+misfolding\s+cyclic\s+amplification/i },
  { label: "MRI DWI", re: /\bDWI\b|diffusion[\s-]weighted/i },
  { label: "MRI", re: /\bMRI\b|magnetic\s+resonance\s+imag/i },
  { label: "EEG", re: /\bEEG\b|electroencephal/i },
  { label: "Neuropathology", re: /autops|neuropatholog|immunohistochem|\bspongiform\b|prion\s+protein\s+scrapie|\bPrPSc\b|\bPrP\s*Sc\b/i },
  { label: "PRNP sequencing", re: /\bsequenc|\bSanger\b|genetic\s+test|\bPCR\b|next-?generation\s+sequencing|\bWGS\b|\bNGS\b/i },
  { label: "CSF analysis", re: /cerebrospinal|\bCSF\b/i },
  { label: "Genotyping 129", re: /codon\s*129|129\s*(MM|MV|VV)|methionine\s*129|valine\s*129/i },
];

const FEATURE_RULES: Rule[] = [
  { label: "Rapid progression", re: /rapid(ly)?[\s-]progress/i },
  { label: "Myoclonus", re: /myoclon/i },
  { label: "Ataxia", re: /ataxia|cerebellar\s+(sign|syndrome|ataxia)|gait\s+disturb/i },
  { label: "Insomnia", re: /insomnia/i },
  { label: "Psychiatric signs", re: /psychiatric|psychosis|hallucinat|delusion|agitation|depression/i },
  { label: "Cognitive decline", re: /dementia|cognitive\s+(decline|dysfunction|impairment)/i },
  { label: "Amyloid plaques", re: /amyloid\s+plaque|kuru\s+plaque|amyloid\s+deposits?/i },
];

const CAP = 5; // keep chips readable

function runRules(text: string, rules: Rule[]): string[] {
  const out: string[] = [];
  for (const rule of rules) {
    if (rule.re.test(text)) {
      out.push(rule.label);
      if (out.length >= CAP) break;
    }
  }
  return out;
}

/**
 * Detect etiology / diagnostics / features mentioned in a piece of text
 * (typically title + abstract). Purely additive: absence of a label
 * means "not mentioned", never "ruled out".
 */
export function detectContext(text: string): PaperContext {
  if (!text) return { etiology: [], modalities: [], features: [] };
  return {
    etiology: runRules(text, ETIOLOGY_RULES),
    modalities: runRules(text, MODALITY_RULES),
    features: runRules(text, FEATURE_RULES),
  };
}

/** Convenience wrapper for papers (title + abstract). */
export function detectPaperContext(title: string, abstract: string): PaperContext {
  return detectContext(`${title ?? ""} ${abstract ?? ""}`);
}
