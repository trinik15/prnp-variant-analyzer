#!/usr/bin/env python3
"""
PRNP Variant Harvester -- Open-Source Literature & Variant Frequency Analyzer
==============================================================================
Expert neurogenetics / bioinformatics edition.

Utilizes the public NCBI Entrez/PubMed APIs to pull the last N (default 100)
peer-reviewed papers explicitly mentioning "Prion Protein Variant" or
"PRNP mutation", parses titles + abstracts for common genetic variant
notations (e.g. E200K, P102L, D178N), counts the literature frequency of
every variant, and outputs a clean markdown-formatted summary table
(Variant | Mutation Type | Number of Mentions).

This is the standalone companion of the web-based "PRNP Variant Analyzer".
Host it, fork it, extend it -- so independent researchers and students never
have to comb through thousands of PDF case reports manually again.

Dependencies
------------
    pip install biopython

Usage
-----
    python prnp_pubmed_variants.py                       # last 100 papers, markdown to stdout
    python prnp_pubmed_variants.py --retmax 200          # wider window
    python prnp_pubmed_variants.py --md report.md        # also save markdown report
    python prnp_pubmed_variants.py --csv variants.csv    # also save machine-readable CSV
    python prnp_pubmed_variants.py --sort relevance      # relevance instead of newest-first

Output
------
    # PRNP Variant Literature Frequency Report
    ...metadata (query, papers analysed, date window)...
    | Variant | Mutation Type | Number of Mentions |
    |---------|---------------|--------------------|
    | E200K   | Missense      | 14                 |
    ...

NCBI policy: identifies itself with a tool name + email; please keep
Entrez.email set to a real address you control and stay below 3 req/s.

License: MIT -- for research and community use. Not a clinical tool.
"""

from __future__ import annotations

import argparse
import csv
import datetime as _dt
import re
import sys
import time
from collections import Counter, defaultdict

try:
    from Bio import Entrez, Medline
except ImportError:
    sys.exit("Biopython is required:  pip install biopython")

# ----------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------

EMAIL = "your-email@example.org"  # <-- set a real address (NCBI requirement)
TOOL = "prnp-variant-harvester"
PRNP_LENGTH = 253  # human PRNP isoform 1 (incl. signal peptide)
MIN_CODON = 40     # point mutations reported in the literature live in this window
MAX_CODON = PRNP_LENGTH - 10

#: Default query -- papers explicitly mentioning the requested phrases.
DEFAULT_TERM = (
    '"prion protein variant"[tiab] OR "prion protein variants"[tiab] '
    'OR "PRNP mutation"[tiab] OR "PRNP mutations"[tiab]'
)

AA1 = "ACDEFGHIKLMNPQRSTVWY"

THREE_TO_ONE = {
    "Ala": "A", "Arg": "R", "Asn": "N", "Asp": "D", "Cys": "C",
    "Gln": "Q", "Glu": "E", "Gly": "G", "His": "H", "Ile": "I",
    "Leu": "L", "Lys": "K", "Met": "M", "Phe": "F", "Pro": "P",
    "Ser": "S", "Thr": "T", "Trp": "W", "Tyr": "Y", "Val": "V",
    "Ter": "X", "Stop": "X",
}
THREE_AA = "|".join(k for k in THREE_TO_ONE if k not in ("Ter", "Stop"))

ONE_ONE_RE = re.compile(r"\b([" + AA1 + r"])(\d{2,3})([" + AA1 + r"X*])\b")
THREE_RE = re.compile(
    r"\b(" + THREE_AA + r")(\d{2,3})(Ter|Stop|X|" + THREE_AA + r")\b"
)
OPRI_RE = re.compile(
    r"octapeptide[\s-]*repeat[\s-]*(?:region[\s-]*)?insertion|\d[\s-]?OPRI", re.I
)
OPRD_RE = re.compile(
    r"octapeptide[\s-]*repeat[\s-]*(?:region[\s-]*)?deletion|\d[\s-]?OPRD", re.I
)

# ----------------------------------------------------------------------
# Curated clinical knowledge base (ClinVar / UniProt P04156 / literature)
# ----------------------------------------------------------------------

KNOWN_VARIANTS: dict[str, tuple[str, str, str]] = {
    # notation: (classification, disease, short description)
    "P102L": ("Pathogenic", "GSS", "First human prion mutation identified (Hsiao 1989)."),
    "P105L": ("Pathogenic", "GSS", "GSS variant, dementia-dominant phenotype."),
    "G114V": ("Pathogenic", "GSS", "Rare GSS substitution."),
    "A117V": ("Pathogenic", "GSS", "GSS Tel-Aviv variant, beta-strand 1."),
    "G131V": ("Pathogenic", "GSS", "GSS variant, beta-strand 1."),
    "A133V": ("Pathogenic", "GSS", "GSS-associated substitution."),
    "G131S": ("Pathogenic", "GSS", "Rare GSS substitution."),
    "Y145X": ("Pathogenic", "GSS", "Truncated PrP, tau-positive plaques."),
    "Q160X": ("Pathogenic", "GSS", "Nonsense variant, PrP amyloid."),
    "Y163X": ("Pathogenic", "GSS", "Truncating stop mutation."),
    "H187R": ("Pathogenic", "GSS", "GSS mutation in helix 2."),
    "F198S": ("Pathogenic", "GSS", "Classic GSS (Indiana kindred), NFTs."),
    "F198L": ("Pathogenic", "GSS", "Rare GSS variant."),
    "D202N": ("Pathogenic", "GSS", "GSS, prominent dementia."),
    "Q212P": ("Pathogenic", "GSS", "Helix-3 proline disrupts helix."),
    "Q217R": ("Pathogenic", "GSS", "GSS (Dutch kindred), NFTs."),
    "Y226X": ("Pathogenic", "GSS", "C-terminal truncation."),
    "Q227X": ("Pathogenic", "GSS", "Helix-3 C-terminal truncation."),
    "D178N": ("Pathogenic", "FFI / fCJD", "129M cis = FFI; 129V cis = fCJD."),
    "V180I": ("Pathogenic", "fCJD", "Common in Japanese cohorts."),
    "T183A": ("Pathogenic", "fCJD", "Altered glycosylation."),
    "H187Y": ("Pathogenic", "fCJD", "Rare helix-2 variant."),
    "T188A": ("Pathogenic", "fCJD", "Helix-2 substitution."),
    "T188K": ("Pathogenic", "fCJD", "Helix-2 substitution."),
    "T188R": ("Pathogenic", "fCJD", "Helix-2 substitution."),
    "E196K": ("Pathogenic", "fCJD", "Rapid phenotype, CN + EU families."),
    "E196A": ("Pathogenic", "fCJD", "Rare codon-196 variant."),
    "E200K": ("Pathogenic", "fCJD", "Most common mutation worldwide."),
    "E200G": ("Pathogenic", "fCJD", "Rare E200 variant."),
    "E200L": ("Pathogenic", "fCJD", "Rare E200 variant."),
    "V203I": ("Pathogenic", "fCJD", "JP + EU patients."),
    "R208H": ("Pathogenic", "fCJD", "Helix-3, European families."),
    "R208C": ("Pathogenic", "fCJD", "Rare helix-3 variant."),
    "V210I": ("Pathogenic", "fCJD", "Frequent in Italy/France."),
    "E211Q": ("Pathogenic", "fCJD", "Rare codon-211 variant."),
    "E211K": ("Risk modifier", "fCJD (risk)", "Analogue of bovine BSE mutation."),
    "M232T": ("Risk modifier", "gPrD (uncertain)", "VUS; cases and controls."),
    "M232R": ("Risk modifier", "gPrD (uncertain)", "Rare, uncertain significance."),
    "M129V": ("Polymorphism", "Codon 129 modifier", "Major disease modifier."),
    "G127V": ("Protective", "Kuru resistance", "Fore population, anti-kuru."),
    "E219K": ("Protective", "sCJD resistance", "Protective in East Asia."),
    "V148I": ("Polymorphism", "Rare modifier", "Uncertain effect."),
    "N171S": ("Risk modifier", "Reduced penetrance", "Cases and controls."),
    "R15C":  ("Risk modifier", "Reduced penetrance", "N-terminal variant."),
    "R15S":  ("Risk modifier", "Reduced penetrance", "N-terminal variant."),
    "G95S":  ("Risk modifier", "Reduced penetrance", "Penetrance debated."),
    "OPRI":  ("Pathogenic", "fCJD / GSS / FFI-like", "Octapeptide repeat insertion."),
    "OPRD":  ("Risk modifier", "Reduced penetrance", "Octapeptide repeat deletion."),
}


def mutation_type(to_aa: str, notation: str) -> str:
    """Map a variant to a human-readable mutation type."""
    if notation == "OPRI":
        return "Insertion (octapeptide repeat)"
    if notation == "OPRD":
        return "Deletion (octapeptide repeat)"
    if to_aa == "X":
        return "Nonsense (stop)"
    return "Missense"


def info_for(notation: str, to_aa: str, position: int) -> tuple[str, str, str]:
    """Return (classification, disease, description) for a variant."""
    if notation in KNOWN_VARIANTS:
        return KNOWN_VARIANTS[notation]
    if to_aa == "X":
        return (
            "Pathogenic (predicted)",
            "Nonsense (predicted GSS-like)",
            "Premature stop at codon %d; requires validation." % position,
        )
    return (
        "Unclassified",
        "",
        "Detected in literature at codon %d; verify against ClinVar." % position,
    )


# ----------------------------------------------------------------------
# Extraction engine
# ----------------------------------------------------------------------

# Compact one-letter notations that are famous variants of NON-PRNP proteins
# falling INSIDE the PRNP codon window (prion-adjacent literature mentions
# them; they would otherwise be misattributed to PRNP as unclassified).
NON_PRNP_LOOKALIKES = {
    "A53T": "SNCA (alpha-synuclein, Parkinson disease)",
    "A30P": "SNCA (alpha-synuclein, Parkinson disease)",
    "E46K": "SNCA (alpha-synuclein, Parkinson disease)",
    "H63D": "HFE (hemochromatosis)",
    "S65C": "HFE (hemochromatosis)",
    "D614G": "SARS-CoV-2 spike",
    "N501Y": "SARS-CoV-2 spike",
    "E484K": "SARS-CoV-2 spike",
    "K417N": "SARS-CoV-2 spike",
    "H274Y": "influenza neuraminidase",
}

# PRNP codon-129 allele shorthand: "129M", "129V", the heterozygote "129MV",
# and word forms "Met129" / "Val129". All normalize to the M129V entry.
CODON129_RES = [
    re.compile(r"\b129(M|V)\b"),
    re.compile(r"\b129(MV|VM)\b"),
    re.compile(r"\b(Met|Val)129\b"),
]


def extract_variants(text: str) -> dict[str, tuple[str, str, int]]:
    """Extract PRNP variant notations from free text.

    Returns {notation: (from_aa, to_aa, position)} — one entry per unique
    notation present in the text.
    """
    found: dict[str, tuple[str, str, int]] = {}

    for m in ONE_ONE_RE.finditer(text):
        frm, pos_s, to = m.group(1), m.group(2), m.group(3)
        pos = int(pos_s)
        if not (MIN_CODON <= pos <= MAX_CODON) or frm == to:
            continue
        to = "X" if to == "*" else to
        notation = "%s%d%s" % (frm, pos, to)
        if notation in NON_PRNP_LOOKALIKES:
            continue
        found.setdefault(notation, (frm, to, pos))

    for m in THREE_RE.finditer(text):
        frm3, pos_s, to3 = m.group(1), m.group(2), m.group(3)
        frm, to = THREE_TO_ONE[frm3], THREE_TO_ONE.get(to3, "X")
        pos = int(pos_s)
        if not (MIN_CODON <= pos <= MAX_CODON) or frm == to:
            continue
        notation = "%s%d%s" % (frm, pos, to)
        if notation in NON_PRNP_LOOKALIKES:
            continue
        found.setdefault(notation, (frm, to, pos))

    if OPRI_RE.search(text):
        found.setdefault("OPRI", ("", "I", 51))
    if OPRD_RE.search(text):
        found.setdefault("OPRD", ("", "D", 51))

    if any(rx.search(text) for rx in CODON129_RES):
        found.setdefault("M129V", ("M", "V", 129))

    return found


def count_variant_mentions(text: str) -> Counter:
    """Count every textual occurrence of each variant notation in text."""
    counts: Counter = Counter()

    for m in ONE_ONE_RE.finditer(text):
        frm, pos_s, to = m.group(1), m.group(2), m.group(3)
        pos = int(pos_s)
        if not (MIN_CODON <= pos <= MAX_CODON) or frm == to:
            continue
        to = "X" if to == "*" else to
        notation = "%s%d%s" % (frm, pos, to)
        if notation in NON_PRNP_LOOKALIKES:
            continue
        counts[notation] += 1

    for m in THREE_RE.finditer(text):
        frm3, pos_s, to3 = m.group(1), m.group(2), m.group(3)
        frm, to = THREE_TO_ONE[frm3], THREE_TO_ONE.get(to3, "X")
        pos = int(pos_s)
        if not (MIN_CODON <= pos <= MAX_CODON) or frm == to:
            continue
        notation = "%s%d%s" % (frm, pos, to)
        if notation in NON_PRNP_LOOKALIKES:
            continue
        counts[notation] += 1

    # codon-129 allele shorthand counts as textual mentions of M129V
    for rx in CODON129_RES:
        counts["M129V"] += len(rx.findall(text))

    if OPRI_RE.search(text):
        counts["OPRI"] += 1
    if OPRD_RE.search(text):
        counts["OPRD"] += 1

    return counts


# ----------------------------------------------------------------------
# PubMed access (with retry/backoff — production hardening)
# ----------------------------------------------------------------------

def _entrez_call(fn, retries: int = 3, delay: float = 1.0, **kwargs):
    """Wrap an Entrez call with simple exponential-backoff retries."""
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            handle = fn(**kwargs)
            data = handle.read() if hasattr(handle, "read") else handle
            try:
                handle.close()
            except Exception:
                pass
            return data
        except Exception as err:  # network hiccups, HTTP 5xx
            last_err = err
            sleep_for = delay * (2 ** attempt)
            sys.stderr.write(
                "  ! Entrez call failed (attempt %d/%d): %s -- retrying in %.1fs\n"
                % (attempt + 1, retries, err, sleep_for)
            )
            time.sleep(sleep_for)
    raise RuntimeError("Entrez call failed after %d attempts: %s" % (retries, last_err))


def search_pubmed(term: str, retmax: int, sort: str,
                  mindate: str | None = None, maxdate: str | None = None):
    """esearch -> (list of PMIDs, total hit count). Newest-first by default."""
    raw = _entrez_call(
        Entrez.esearch, db="pubmed", term=term, retmax=retmax, sort=sort,
        mindate=mindate, maxdate=maxdate, datetype="pdat", retmode="json",
    )
    import json
    record = json.loads(raw)["esearchresult"]
    return record["idlist"], int(record["count"])


def fetch_records(pmids: list[str], batch: int = 100):
    """efetch -> Medline records, fetched in batches (rate-limit friendly)."""
    for i in range(0, len(pmids), batch):
        chunk = pmids[i : i + batch]
        raw = _entrez_call(
            Entrez.efetch, db="pubmed", id=",".join(chunk),
            rettype="medline", retmode="text",
        )
        import io
        for rec in Medline.parse(io.StringIO(raw)):
            yield rec
        time.sleep(0.34)  # NCBI rate limit: <= 3 requests/second


# ----------------------------------------------------------------------
# Report builders
# ----------------------------------------------------------------------

def build_markdown_report(term: str, records: list[dict], mention_totals: Counter,
                          paper_counts: dict[str, int], years: list[int]) -> str:
    """Build the clean markdown summary table (Variant | Mutation Type | Mentions)."""
    lines: list[str] = []
    lines.append("# PRNP Variant Literature Frequency Report")
    lines.append("")
    lines.append("**Query:** `%s`  " % term)
    lines.append("**Papers analysed:** %d (peer-reviewed, PubMed)  " % len(records))
    if years:
        lines.append("**Publication window:** %d - %d  " % (min(years), max(years)))
    lines.append("**Generated:** %s  " % _dt.date.today().isoformat())
    lines.append("**Source:** NCBI PubMed E-utilities (esearch + efetch)")
    lines.append("")
    lines.append("| Variant | Mutation Type | Number of Mentions |")
    lines.append("|---------|---------------|--------------------|")

    ranked = sorted(mention_totals.items(), key=lambda kv: (-kv[1], kv[0]))
    for notation, mentions in ranked:
        to_aa = notation[-1]
        lines.append("| %s | %s | %d |" % (notation, mutation_type(to_aa, notation), mentions))

    lines.append("")
    lines.append("*Mentions = total textual occurrences across titles and abstracts "
                 "of the analysed corpus. Structural events (OPRI/OPRD) are counted "
                 "once per paper discussing them. Always validate novel candidates "
                 "against ClinVar.*")
    lines.append("")
    return "\n".join(lines)


def write_csv(path: str, mention_totals: Counter, paper_counts: dict[str, int]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "notation", "mutation_type", "mentions", "papers",
            "classification", "disease_association",
        ])
        for notation, mentions in sorted(mention_totals.items(), key=lambda kv: (-kv[1], kv[0])):
            to_aa = notation[-1]
            pos = int(notation[1:-1]) if notation[1:-1].isdigit() else 0
            cls, disease, _ = info_for(notation, to_aa, pos)
            writer.writerow([
                notation, mutation_type(to_aa, notation), mentions,
                paper_counts.get(notation, 0), cls, disease,
            ])


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Harvest and count PRNP variant frequencies from PubMed abstracts."
    )
    parser.add_argument("--term", default=DEFAULT_TERM,
                        help='PubMed query (default: papers mentioning "Prion Protein Variant" or "PRNP mutation")')
    parser.add_argument("--retmax", type=int, default=100,
                        help="number of most-recent papers to analyse (default: 100)")
    parser.add_argument("--sort", default="pub_date", choices=["pub_date", "relevance"],
                        help="esearch ordering (default: pub_date = newest first)")
    parser.add_argument("--mindate", default=None, help="min publication year (YYYY)")
    parser.add_argument("--maxdate", default=None, help="max publication year (YYYY)")
    parser.add_argument("--md", default=None, help="also write the markdown report to this path")
    parser.add_argument("--csv", default=None, help="also write a machine-readable CSV to this path")
    args = parser.parse_args()

    Entrez.email = EMAIL
    Entrez.tool = TOOL

    print("[1/4] Searching PubMed for: %s" % args.term)
    pmids, total = search_pubmed(args.term, args.retmax, args.sort,
                                 args.mindate, args.maxdate)
    print("      %d total hits on PubMed; analysing the %d most recent..." % (total, len(pmids)))

    print("[2/4] Fetching titles + abstracts...")
    records = list(fetch_records(pmids))
    print("      %d records retrieved." % len(records))

    print("[3/4] Parsing variant notations & counting mentions...")
    mention_totals: Counter = Counter()
    paper_counts: dict[str, int] = defaultdict(int)
    years: list[int] = []
    for rec in records:
        text = "%s. %s" % (rec.get("TI", ""), rec.get("AB", ""))
        date_str = rec.get("DP", "")
        y = re.match(r"(\d{4})", date_str)
        if y:
            years.append(int(y.group(1)))

        seen_in_paper = extract_variants(text)
        for notation in seen_in_paper:
            paper_counts[notation] += 1
        mention_totals.update(count_variant_mentions(text))
    print("      %d unique variants detected." % len(mention_totals))

    print("[4/4] Building markdown summary table...\n")
    report = build_markdown_report(args.term, records, mention_totals,
                                   paper_counts, years)
    print(report)

    if args.md:
        with open(args.md, "w", encoding="utf-8") as f:
            f.write(report)
        print("Markdown report saved to %s" % args.md)
    if args.csv:
        write_csv(args.csv, mention_totals, paper_counts)
        print("CSV saved to %s" % args.csv)

    print("Done -- %d variants across %d papers." % (len(mention_totals), len(records)))
    print("Remember to cite the underlying papers (PMIDs available via --csv)!")


if __name__ == "__main__":
    main()
