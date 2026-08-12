# Picor — rules in force

**Read [`AGENTS.md`](AGENTS.md) before the task. It is the rules; this file is not.**

This file exists because Claude Code loads `CLAUDE.md` automatically and does not reliably load
`AGENTS.md`. It is a **loader, not a second copy**. Handbook §0 forbids symlinking one rule file to
another — tools apply their own precedence, and symlinks are unreliable on Windows — and the reason
it prescribes generation instead is to avoid a duplicate that drifts. A pointer has nothing to
drift.

So: everything that governs work here is in `AGENTS.md`, which is Handbook §26 condensed and is
generated upstream. Do not restate its rules here.

## What this repository is

A **static conversion site** (Handbook §26): markup, styles, scripts and assets, served as files.
No backend, no authenticated user, no database. Business logic — messaging, measurement — runs in
third-party platforms.

**The repository is the web root.** A file you commit is published at the corresponding URL. That
makes `.gitignore` an access-control decision, and it makes "delete it later" not a remedy: a
deleted file stays in edge caches, in search indexes, and in history.

## This site is ADOPTING the standard — read this before you trust the gate

It has been in production since April 2026 and predates these rules, so **it violates them, in
places that were not mistakes when they were written**. Three things follow, and getting them wrong
is the common failure:

1. **A green gate here does not mean the site complies.** It means nothing NEW was added. What the
   site already owed is carried in `.gate-baseline.json` by `scripts/ratchet.mjs`.
2. **Every known violation is in exactly one of four buckets** — fixed, [debt](docs/technical-debt.md),
   inapplicable, or [blocked on a decision](docs/open-definitions.md). Start at
   [`docs/adoption-baseline.md`](docs/adoption-baseline.md), which is the measurement of day one and
   the index to all four.
3. **Do not make the gate green by silencing a check.** A blanket disable removes the rule for the
   code written tomorrow too. Where a suppression is genuinely needed it names the specific rule, is
   scoped as narrowly as possible, and states why (§20).

Before fixing something that looks broken, check whether it is already bucketed. If it is, the entry
says what it costs and what triggers the fix; if it is not, it is a finding worth adding.

## Running the gate locally

```bash
node scripts/check-config.mjs      # identifiers outside config.js, placeholders, the receiver
node scripts/check-markup.mjs      # indexability, heading order, the four mobile render rules
node scripts/check-assets.mjs      # byte budgets, orphans, third-party origins on first render
node scripts/ratchet.mjs           # the only one that decides pass/fail — did anything RISE?
```

Fixed something? `node scripts/ratchet.mjs --update`, **committed with the fix**. A baseline left
high keeps headroom, and the violation you just removed can come back for free.

## Language

Code, comments, commits and documentation in **English**. User-facing copy in **Spanish (es-AR)**,
which is what the site is written in and what its visitors read (§13).
