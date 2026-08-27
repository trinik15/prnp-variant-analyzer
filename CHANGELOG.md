# Changelog

All notable changes to the PRNP Variant Analyzer are documented here.
The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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

