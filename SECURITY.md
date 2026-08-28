# Security Policy

## Supported versions

Only the latest release on `main` is supported.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting
(Security tab -> Report a vulnerability) rather than a public issue.

## Scope notes

This is a research tool that queries public NCBI APIs and runs a
deterministic regex pipeline. There is no authentication, no user data
storage and no secrets in the codebase. The classes of issues we care most
about:

- Injection through user-supplied PubMed query terms into the pipeline.
- Path traversal or file exposure via the export endpoints.
- Anything that would make the tool misreport variant evidence silently
  (a correctness issue with safety implications for downstream research).

While not a security issue in the classic sense, false-negative/false-positive
variant extractions are treated as high-priority bugs.
