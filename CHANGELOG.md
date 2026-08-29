# Changelog

All notable changes to the PRNP Variant Analyzer are documented here.
The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
## [1.0.0] - 2026-08-29

Public launch.

### Added
- Codon-129 allele shorthand detection: `129M`, `129V`, `129MV`, `Met129`,
  `Val129` all fold into the curated M129V entry (#1).
- Guard breakdown in the extraction response: candidates scanned, rejection
  categories with gene attribution, shorthand fold count (#1).
- Playground stress test button loading every adversarial case at once (#1).
- Standalone Biopython pipeline (`public/scripts/prnp_pubmed_variants.py`)
  mirroring the TypeScript engine: identical output on the adversarial
  suite.

### Fixed
- Shared global regexes no longer leak `lastIndex` between scans; match
  counts are now order-independent (#1).

### CI
- Python engine smoke test enabled now that the pipeline has landed
  (runs fully offline).

## [0.3.0] - 2026-08-29

### Added
- Tool-first homepage: the analyzer panel is the page; every run writes
  a shareable `?term=` URL.
- CI: lint + typecheck for the web app.
- Machine-readable surface: `/llms.txt` plus real PNG renders under
  `/screenshots/`.
- Community files: contributing guide, code of conduct, security policy,
  issue and PR templates.

## [0.2.0] - 2026-08-27

### Added
- Analyze pipeline API and dataset endpoints (stats, variants, papers,
  CSV export, frequency report).
- Zero-setup extraction endpoint, example showcase and cross-field
  PubMed counts.
- Analyzer UI: search panel, stat cards, charts, variants table with
  variant dossier, papers table with annotated abstracts, report and
  Python script panels, pipeline strip.
- Extraction playground with live example and cross-field strip.

### Fixed
- Famous non-PRNP lookalikes (SNCA A53T/E46K, HFE H63D, SARS-CoV-2
  D614G/N501Y, influenza H274Y) are rejected instead of being kept as
  unclassified PRNP variants.

## [0.1.0] - 2026-08-25

### Added
- Variant extraction core: one-letter, three-letter and octapeptide-repeat
  notation, codon window 40-243.
- Curated knowledge base with evidence tiers, clinical context detection
  and provenance.
- PubMed E-utilities client (rate-limited, no API key required) and
  frequency report builder.

