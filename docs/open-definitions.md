# Open definitions and inapplicable rules

Two registers, kept together because they answer the same question from opposite sides: *why is this
rule not being followed here?*

- **Blocked on a decision** — the rule applies, and complying needs a choice nobody has made: a
  provider, a budget, an owner. Each row carries **the default that holds while it is open**, so an
  open row never stops work.
- **Inapplicable** — the rule genuinely does not apply to this repository. Recorded **with the
  reason**, never deleted and never silently skipped.

Neither is a place to put something that is simply wrong and expensive. That is
[`technical-debt.md`](technical-debt.md), and it needs a trigger and an owner.

All entries date from the [adoption baseline](adoption-baseline.md) of 2026-08-11.

---

## Blocked on a decision

| # | The question | Governing section | Why it cannot just be decided by whoever reads this | Default while open | Opened |
|---|---|---|---|---|---|
| **OPEN-01** | **The consent decision.** §26 requires four things recorded: the jurisdiction whose law this answers, what was decided, who decided it, and — the load-bearing half — **the condition that would change the answer**. None exists. The tag container has loaded unconditionally on first render since April | §26 | It is a legal and commercial judgement about Argentine law and about whether Picor will advertise into jurisdictions requiring prior consent. An agent guessing it produces a compliance claim nobody made | **Assume Argentina (Ley 25.326) and notice-only**: the privacy statement added by FIX-02 is reachable from every page and states what is collected and by whom. Tags continue to load. This is what the site does today, now written down instead of implied. **It is not a consent mechanism and must not be described as one** | 2026-08-11 |
| **OPEN-02** | **The conversion receiver, and whether the email waitlist becomes a real list.** §26: every conversion path terminates in a system the business controls, and the record is written there *before* any handoff. Nothing is persisted today — and the "avisame cuando lancen la tienda" field collects addresses that feed no list, with no confirmed opt-in, no unsubscribe and no consent record | §26 | Choosing a receiver is a spend and an ownership decision: which provider, who answers a submission by name, what the reply is. §26's rule for the waitlist is unambiguous — *a mailing list exists before the field that feeds it* — so the honest options are build the list or remove the field, and both are Juan's call | **Neither path claims more than it does.** FIX-03 has already removed the false success state, so the site no longer tells a visitor their message was sent when it was not. The form still hands off to WhatsApp and persists nothing, which is now what the copy says | 2026-08-11 |
| **OPEN-03** | **Hosting.** §26 makes this the *first* decision, because the host determines which controls are available at all. It was never taken here: the site is on Apache shared hosting at `200.58.111.96`, published by manual upload, with no security headers and no pipeline that could refuse a bad publish. **DECIDED 2026-08-11 by Juan Torresel: move to GitHub Pages, published by this repository's gate.** Not closed — the migration is blocked, and the choice has a cost that must be recorded before it is paid | §26 | **Blocked on a plan-or-visibility decision.** `makesensedigital` is on the GitHub **free** plan, where Pages serves **public repositories only**. `picor` is private. So publishing from Pages requires either making the repository public or upgrading the org — money or exposure, and both are Juan's. See *What this choice forecloses* below | Stay on Apache. The manual upload continues and §26's "the pipeline is the publication origin" stays unmet. The gate verifies every pull request but publishes nothing, and `gate.yml` says so in its header rather than implying otherwise | 2026-08-11 |
| **OPEN-04** | **The OpenSpec workspace (§19).** §26 does not suspend the spec-driven lifecycle, and this repository has no `openspec/` — no `project.md` binding it to the handbook, no change proposals, no archive | §19, §26 | It is a working-process decision for a one-person site, not a technical one. Scaffolding a workspace nobody uses produces ceremony that gets abandoned, which is worse than not having it | Changes arrive as pull requests with a commit body that says *why*, which is what the git history already carries. Revisit when a second person can merge, or when a change is large enough that the proposal would genuinely help | 2026-08-11 |

### OPEN-03 — what this choice forecloses

§26 requires recording not only which host was chosen but **what the choice puts out of reach**.
This is the part that is easy to skip and impossible to recover later, so it is written before the
migration rather than after.

GitHub Pages **cannot serve custom response headers and cannot issue a real redirect.** Concretely,
moving there means:

| Capability | On Apache today | On GitHub Pages | Consequence |
|---|---|---|---|
| Custom response headers | Available via `.htaccess`, **unused** | **Impossible** | No content security policy, no permissions policy, no referrer policy — ever |
| Framing control | Available, unused | **Impossible** | A header is the only way to express it. There is **no protection against framing at all** |
| Real redirect status | Available, unused | **Impossible** | DEBT-09 (`www` vs apex) may become unfixable. Any future retired URL cannot be redirected |
| TLS renewal | Manual, and **it lapsed on 2026-07-09** | Automatic | This is the strongest argument for the move — FIX-01 stops recurring |
| Publication origin | Manual upload | **The gate** | §26's core requirement for this class becomes met |
| Rollback | Unknown | Re-run a previous deployment | A number Juan is entitled to before he needs it |

**The honest summary: this trades away controls that are currently unused for controls that are
currently missing.** The site has no headers today, so nothing in use is lost. But the *option* is
lost permanently, and if a content security policy is ever wanted, the answer on Pages is "change
host again". A reader in a year should find that written here rather than discover it.

**The migration order is not negotiable**, because getting it wrong publishes two live copies of the
site or unbinds the domain:

1. ~~Resolve the plan-or-visibility blocker.~~ **Done 2026-08-11** — the repository was made
   public, which is what Pages requires on the free plan. Full history was scanned for credentials
   first and none were found; nothing had ever been deleted from it either.
2. ~~Enable Pages, publishing from GitHub Actions.~~ **Done 2026-08-11** — `build_type: workflow`,
   publishing to `https://makesensedigital.github.io/picor/`.
3. **Add the publish job and verify the `github.io` copy renders.** Root-absolute paths
   (`/favicon.ico`, `/privacy.html`, `/site.webmanifest`) will 404 there because a project page is
   served under `/picor/`. That resolves itself when the custom domain binds and the site is at a
   root again — it is an artefact of verifying on a subpath, not a defect.
4. Verify domain ownership at the **organization** level. §26: verification is what stops another
   account claiming the domain.
5. Move DNS. Confirm the `www` variant is handled — DEBT-09 cannot be fixed after this point,
   because Pages issues no redirects at all.
6. Commit `CNAME`. Publishing from a workflow without it unbinds the custom domain silently: the
   site keeps working on the github.io address and `picor.com.ar` stops resolving.
7. Only then stop the manual upload.

**Correction to the order originally written here (2026-08-11).** The first version said to commit
`CNAME` *in the same change that adds the publish job*. That is wrong and would have made step 3
impossible: setting the custom domain makes the github.io address redirect to `picor.com.ar`, which
still resolves to Apache — so there would be nothing to verify before the switch. `CNAME` goes with
the DNS move, at step 6.

Steps 4 and 5 are irreversible actions and route to a human under the §22 decision matrix. No agent
performs them.

---

## Inapplicable — recorded, not skipped

| # | The rule | Why it does not apply here | What replaces it | Recorded |
|---|---|---|---|---|
| **INAPP-01** | **§20's five quality-gate stages** — format, type, unit, integration, dependency audit | §26 declares them inapplicable for this class **by name**: there is no build, no type system, no unit suite and no dependency tree. This site has no `package.json` and the gate's own checks are Node stdlib with zero dependencies | The eleven-point delivery gate of §26, implemented in `.github/workflows/gate.yml`. Dropping the five silently would be the failure; naming them is the rule | 2026-08-11 |
| **INAPP-02** | **`scripts/test-gate.mjs`** — the gate's own test, which §20 requires because a check that has never failed on purpose is not known to work | It cannot run in an adopting repository. It builds fixtures by copying the repository around it and editing the *template's* placeholder values (`https://example` and friends); here those values are real, the fixture setup throws, and no check is ever reached. It tests **the checks**, and the checks are maintained upstream — so its home is the handbook repository, where it runs against the template on every change | `scripts/.vendored.sha256`, verified by the gate. It covers the risk that mattered here — a check edited locally to make a finding disappear — by failing the build on any local edit to the five vendored scripts | 2026-08-11 |
| **INAPP-03** | **`check-config`'s placeholder scan, as applied to binary files.** 6 of the 53 machine findings are the three-letter unanswered-marker appearing inside the compressed data of three PNGs | The rule — no unanswered placeholder in a file that ships — is real and does apply to this site. It does not apply to **binary image data**, where the match is a byte coincidence. The identifier scan in the same file filters to `.html`, `.js` and `.css`; the placeholder scan does not, and that is a defect in the instrument rather than a property of this site | Nothing, deliberately. The six findings are **left in the raw count and in `.gate-baseline.json` exactly as measured** — a measurement is annotated, not hand-corrected. They will drop out on their own when DEBT-02 re-encodes those images. **The fix belongs upstream**; the checks are hash-pinned here so nobody patches it locally, and the friction is handbook feedback under §12 | 2026-08-11 |

| **INAPP-04** | **`check-assets`'s reference scan, as applied to the ratchet's own baseline file.** `.gate-baseline.json` keys embed asset paths (`check-assets|images/hero-fondo.png`); the scan reads them as references and reports each as *referenced but not committed* | The rule — every referenced asset is committed — is real and applies to this site. It does not apply to the **gate's own artifact**, which is not site content and is not served. `walk()` already skips `scripts/` and `.github/` for exactly that reason; this file is the same kind of thing at a different path | **This one needed a local patch**, unlike INAPP-03, because it is not merely noisy — it is fatal. `--init` recorded 53 findings, and the very next run measured 73 with 20 spurious increases: the ratchet's first act would have made the gate permanently red on a file it wrote itself. One filter clause in `check-assets.mjs`, marked in place, hash-pinned, and documented in `.github/handbook-version.md`. **Revert it and re-take the file when the upstream fix ships** | 2026-08-11 |

---

## How to close a row

**Blocked on a decision:** decide it, write the decision and the date into the row, and move whatever
work it unblocks. If the decision makes the rule permanently unreachable — a control the chosen host
cannot provide — the row moves to *Inapplicable* with that as its reason. It is not deleted.

**Inapplicable:** if the premise changes — this site grows a backend, the upstream check is fixed —
delete the row in the same commit that starts following the rule.

Neither register is closed by making a finding stop appearing. A finding that stops appearing
because a check was disabled is not closed; it is hidden, and `scripts/.vendored.sha256` exists to
make that visible in a diff.
