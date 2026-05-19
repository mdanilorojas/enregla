# Mega-Audit 2026-05-12

Triple-pass deep audit of EnRegla. All findings converge in `FINAL-REPORT.md` / `FINAL-REPORT.html`.

## Structure

- `pass1-*.md` — 8 parallel domain audits (DB/RLS, auth/security, frontend arch, features, design system, build/tests, docs drift, deps/perf).
- `pass2-*.md` — second independent pass, drilling into highest-risk findings from Pass 1.
- `pass3-*.md` — cross-cutting verification (behavior, a11y, i18n, observability, golden-path smoke).
- `FINAL-REPORT.md` / `FINAL-REPORT.html` — consolidated, deduped, prioritized.

Do not edit pass files after consolidation — they are the raw record.
