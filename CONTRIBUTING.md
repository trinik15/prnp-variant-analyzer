# Contributing to PRNP Variant Analyzer

Thanks for looking under the hood. This is a small, opinionated research
tool - the fastest useful contributions are engine corrections and
workflow feedback from people who actually work with prion literature.

## Development setup

```bash
bun install          # or npm install
bun run db:push      # create the SQLite database (Prisma)
bun run dev          # http://localhost:3000
```

Lint and typecheck before opening a PR:

```bash
bun run lint
bunx tsc --noEmit
```

## Commit style

I keep conventional commits (`feat:` / `fix:` / `docs:` / `chore:`) so the
CHANGELOG and release notes stay greppable. Match that in PRs.

## Changing the extraction engine?

The engine (`src/lib/prion/extract.ts`) is the most sensitive part of the
codebase. If your PR touches it:

1. **Check the Python mirror.** `public/scripts/prnp_pubmed_variants.py`
   must produce the same output as the TypeScript engine. Both engines are
   exercised against the same adversarial cases (synonyms, `129M`/`Val129`
   shorthand, multi-variant paragraphs, cross-gene lookalikes such as SNCA
   A53T or HFE H63D, out-of-window probes like D614G, contradictory
   evidence).
2. **Try the playground stress test.** Load it from the UI ("Stress test"
   button) and confirm the structured output and the guard breakdown look
   right before and after your change.
3. **Respect the codon window.** Point mutations are constrained to codons
   40-243 (between the signal peptide and the GPI-anchor site). Out-of-window
   rejections are intentional, not bugs.

## Ground rules

- **No clinical claims.** Evidence tiers describe what the literature
  reports; the tool is not a classifier and says so. Do not add anything
  that presents a variant call as a diagnosis.
- **Be polite to NCBI.** E-utilities are a shared public resource: keep the
  3 req/s rate limit intact and do not add parallel fetchers.
- **Cite your sources.** New knowledge-base entries need at least one PMID
  in the provenance field.

## Opening issues

- Bug reports: include the query or input text, the expected variants, and
  what the tool produced.
- Feature ideas: describe the research workflow that would benefit - the
  roadmap is prioritized by real-world usefulness, not by coolness.
