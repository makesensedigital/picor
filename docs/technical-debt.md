<!-- Governed by Handbook §22 ("The repository is the agent's memory") and §26. -->

# Technical debt — known and accepted

What is knowingly wrong in this site, why it was accepted, and what would trigger fixing it.

**This file exists for the agent as much as for the reader.** An agent has no memory between
sessions beyond what this repository holds, and a deliberate compromise that is not written down is
indistinguishable from a mistake. An agent that meets one either "fixes" it — undoing a decision
nobody recorded — or copies it, believing it is intended. Both outcomes are worse than the debt
itself, and the second one spreads.

Four fields are mandatory. **Without a trigger** it is a complaint. **Without an owner** it is
nobody's. **Without a reason** the next reader cannot tell whether it is safe to remove. **Without a
cost** it cannot be prioritised against anything.

Every entry here came from the [adoption baseline](adoption-baseline.md) of 2026-08-11. None of it
was a mistake when it was written: the rules arrived four months after the site did.

> **The bucket test.** Debt is a real violation that is expensive to fix and **safe to carry
> meanwhile**. Anything contract-sensitive — a credential, an ungated endpoint, personal data with
> no disclosure, a claim to the visitor that is false — is *not* debt however cheap it looks, and is
> not in this file. Those went to the fix-now bucket and are already done.

---

## Open

| # | What is wrong | Findings | Why it was accepted | Cost of leaving it | Trigger to fix | Owner | Since |
|---|---|---|---|---|---|---|---|
| **DEBT-01** | **External identifiers are literals in the markup, not references to `config.js`.** The WhatsApp number appears 7×, the mailbox once, the tag container id once | 9 | Wiring them means introducing `site.js` and rewriting every control's `href` in a 1168-line document that has no tests. `config.js` now declares them, so the duplication is at least visible | A number change is 9 edits. By the third, one is missed — and a wrong number on one of nine buttons looks exactly like a right one | The next time any of these values changes, or when DEBT-11 rewrites the markup anyway — whichever is first | Juan Torresel | 2026-08-11 |
| **DEBT-02** | **31.58 MB of referenced weight on `index.html`**, against a 2 MB budget. 11 images over the 300 KB per-image budget; 5 photographs stored in a lossless format. `education-comparativa.png` alone is 9.4 MB | 17 | Re-encoding is mechanical but touches 11 binary assets and needs a visual check on each. It is the single largest item here and the most obviously worth doing | This is availability, not only speed: on a metered host it exhausts a transfer allowance in a few thousand visits, and on mobile data it is a page most visitors never see finish. It is also why the performance floors cannot be turned on (DEBT-14) | Immediately after FIX-01 lands. This is the top of the queue — it is the cheapest large win on the site | Juan Torresel | 2026-08-11 |
| **DEBT-03** | **`flyer-b2b.html` references 4 images that are not in the repository** — `campo-surcos.jpeg`, `logo-pepper.svg`, `producto-detalle.jpeg`, `sin-tacc-logo.jpg`. Two further images are committed and referenced from nowhere | 6 | Not carried because it is hard — carried because **it is not yet known whether the flyer is still in use**, and deleting a page somebody hands to prospects is worse than leaving it broken for another week. See the assumption in `brief.md` | The flyer is a B2B page sent directly to prospects and it renders with four broken images today. In this architecture a 404 raises nothing anywhere | Juan confirms whether the flyer is still sent. If yes, fix the four references; if no, delete the page. **Either answer closes this** | Juan Torresel | 2026-08-11 |
| **DEBT-04** | **Google Fonts is contacted on first render**, from `fonts.googleapis.com` and `fonts.gstatic.com`, before any consent choice exists | 3 | Self-hosting the typefaces is the right fix and needs the font files, a `@font-face` block and a visual check. It is an hour, not a minute | Every visitor's address reaches a third party before they choose anything, and with no server there is nothing to proxy it through. It also blocks first render on a second origin | With OPEN-01 (the consent decision) — the two are the same conversation. **Do not close this by adding the origins to the allowlist**; that converts a finding into a decision nobody took | Juan Torresel | 2026-08-11 |
| **DEBT-05** | **No skip link on either document.** A keyboard user tabs the entire navigation on every page | 2 | §6c is explicitly not suspended for this class, so this is a real violation. It is cheap — an anchor and a CSS rule — but it is an access barrier rather than an open hole, so it is not contract-sensitive and it is not in the fix-now bucket | A keyboard-only visitor cannot reach the content without tabbing through the whole nav; on the contact page that is the conversion path | With the next change to either document's `<body>`, whichever comes first | Juan Torresel | 2026-08-11 |
| **DEBT-06** | **Images declare no intrinsic `width`/`height`**, so the page shifts as they load | 2 | It is one attribute pair per `<img>` across two documents, but the correct values have to be read off each asset — and DEBT-02 is about to change every one of those assets | Cumulative layout shift on every visit, worst on the slow connections that already suffer most from DEBT-02 | **Do this inside DEBT-02.** Re-encoding the images is when the final dimensions are known; doing it before means doing it twice | Juan Torresel | 2026-08-11 |
| **DEBT-07** | **Three of the four mobile render rules are broken in `style.css`**: a full-height rule uses `vh` instead of `dvh`; an element fixed to the bottom edge ignores the safe area; form controls are set to 15.2px and 14.4px, below the 16px no-zoom floor; no minimum interactive target size is declared | 5 | Each is a small change to a 2489-line stylesheet with no visual regression test. Together they need a pass on a real handset, which is also what §26 requires and what has never been done here | Every one of these fails only on a phone, which is where this traffic is. The sticky WhatsApp button sits under the gesture bar; the form zooms on focus and throws the visitor out of position mid-form | The first real-device pass — which is a listed pre-publication item in `brief.md` that has never been performed. Bundle all five | Juan Torresel | 2026-08-11 |
| **DEBT-08** | **`analytics.js` holds a literal container id and a placeholder sentinel.** The file compares against the template placeholder string in order to detect an unconfigured container, so the check reports it | 2 | Two ways to close this and the cheap one is wrong. A one-line scoped `check-config: allow` comment would silence it honestly, but the file is being **replaced** anyway: it has no consent default and no intent/outcome split, both of which OPEN-01 and the fix-now bucket already require | Nothing on its own. This entry exists so the two findings in the baseline are not mistaken for something unexplained | With OPEN-01, when `analytics.js` is replaced by the template's — which loads the consent default *before* the container. Closing it earlier with a suppression is allowed but wasted | Juan Torresel | 2026-08-11 |
| **DEBT-09** | **`www.picor.com.ar` and `picor.com.ar` both serve 200** with no redirect between them — two origins, one site | 1 | Fixing it needs a redirect, which the current host can do via `.htaccess` and the decided host (GitHub Pages) **cannot do at all**. Doing it now means doing it twice, and doing it the second way may not be possible | Split signals between two origins. The `<link rel="canonical">` points at the apex, which is what limits the damage today | With OPEN-03, in the migration. **Verify before migrating** that the chosen host handles the `www` variant, because this one cannot be fixed afterwards | Juan Torresel | 2026-08-11 |
| **DEBT-10** | **`GTM_SETUP.md` is published at a public URL** — internal setup documentation, served because the repository is the web root | 1 | Not dangerous: it was read during adoption and holds no credential, only the container id, which ships in the markup anyway. **Its premise also changed on 2026-08-11** — the repository was made public for GitHub Pages, so the file is readable on GitHub regardless of whether the site serves it. Removing it from the artifact now hides it from nobody | Internal material at a public URL invites the next internal file being committed the same way. That is the habit this entry exists to interrupt, and it survives the repository going public | Either move it under a path the publish artifact excludes, or accept it deliberately and say so here. **Decide at the next change to the measurement setup** — that is when somebody opens this file anyway. Note that deleting it does not unpublish it: it stays in caches, indexes and history | Juan Torresel | 2026-08-11 |
| **DEBT-11** | **Business facts are declared in three independent places** — the markup, the JSON-LD block, and `llms.txt`. There is no `facts.js` and no derivation | 0 (gate cannot see it) | Adopting the single-source derivation means `facts.js`, `build-derived.mjs`, and rewriting `index.html` around generated blocks. It is the largest structural change on this list | Each change to an address, a telephone number or an offering is three edits. A missed one is not a stale comment — it is a **published contradiction**, and an assistant answering a question about Picor will confidently state whichever it read | The next time a business fact changes. That is the moment the cost becomes concrete rather than theoretical | Juan Torresel | 2026-08-11 |
| **DEBT-12** | **No asset versioning.** Nothing in the markup carries `?v=`, so there is no cache invalidation at all | 0 (gate cannot see it — `config.assetVersion` matches trivially because nothing references it) | Adding `?v=` to every asset reference is part of the same markup pass as DEBT-01 | A returning visitor gets whatever the edge held. After a style change, old CSS against new markup — which looks like a bug in the site rather than a cache | With DEBT-01 or DEBT-02, whichever rewrites the markup first. `config.assetVersion` is already declared and starts at 1 | Juan Torresel | 2026-08-11 |
| **DEBT-13** | **Four of the six WhatsApp controls compose no message.** They open an empty conversation, so the business receives a message with no context at all | 0 (gate cannot see it) | The message templates now exist in `config.messages`, but wiring them is the same markup rewrite as DEBT-01 | The composed text is the **entire** context the business receives. An empty conversation from an unknown number is a lead that has to be re-qualified from zero, and some fraction never are | With DEBT-01 — same edit, same lines | Juan Torresel | 2026-08-11 |
| **DEBT-14** | **The performance and accessibility floors do not block the gate**, and no `lighthouserc.json` floors file exists. The step runs and reports; it cannot fail the build | 0 (gate configuration) | Any real floor fails today because of DEBT-02, and a step that is red from day one is a step somebody switches off within a week — which is the failure this whole procedure exists to avoid. It runs so the number is visible and moves | The floors are advisory, so a regression between now and DEBT-02 would not be caught. This is the one place the gate is weaker than the template's | **DEBT-02 landing.** That is the trigger, it is specific, and the same commit that re-encodes the images sets the floors and removes `continue-on-error` | Juan Torresel | 2026-08-11 |

**Total: 14 entries, 48 of the 66 baseline findings** — one was paid down on 2026-08-11, see below.

---

## Paid down

An entry moves here rather than being deleted, so the reasoning survives its resolution.

| # | What it was | How it was resolved | Closed |
|---|---|---|---|
| **DEBT-10a** | **No published not-found document.** A wrong URL returned Apache's default error page — a dead end with no route back to the site | `404.html` added, served automatically by GitHub Pages from the root. Self-contained: its styles are inline rather than in `style.css`, because a page that reports a failure must not depend on another file that can fail the same way. `noindex`, and out of the sitemap | 2026-08-11 |

---

## What does not belong here

- **A bug.** Fixed, or tracked as work — not accepted as debt.
- **A rule you disagree with.** That is handbook feedback (§12): surface the friction, do not work
  around it. The handbook is where a rule changes; `scripts/` is hash-pinned so it cannot be here.
- **An undecided question.** That belongs in [`open-definitions.md`](open-definitions.md), and it is
  permitted while open.
- **An entry with no trigger.** Debt with no condition for repayment is a decision nobody wants to
  defend.
- **Anything contract-sensitive.** See the bucket test at the top of this file.
