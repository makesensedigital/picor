# Adoption baseline — what this site owed on the day the standard arrived

**Measured 2026-08-11 · Handbook v3.7.1 (`de0216f`) · commit `5e5a226` (rules only, no code changed)**

This is a **measurement, not a task list.** Reading it as a task list is what produces the two
failures the `adopt-an-existing-repository` skill exists to prevent: the rewrite nobody funds, and
the gate made green by exempting whatever failed.

The site went live in April 2026 and predates every rule below. **None of these were mistakes when
they were written.** The rules arrived after the code; on the day they land, the code violates them.

## Headline

| | |
|---|---|
| Findings the gate can see | **53** |
| — of which are instrument defects, not violations | **6** (see *Known instrument error*) |
| — genuine machine-visible violations | **47** |
| Findings the gate **cannot** see | **13** (live probes and architecture — listed below) |
| Files carrying at least one finding | 21 |
| Buckets assigned | *(step 3 — see the triage commit that follows this one)* |

**The gate is not green and is not supposed to be.** From here it fails only on what is *new*; see
`.gate-baseline.json` and `scripts/ratchet.mjs`.

## Method — so this number can be reproduced and disputed

```bash
git checkout 5e5a226
node scripts/check-config.mjs --json
node scripts/check-markup.mjs --json
node scripts/check-assets.mjs --json
```

The live-site observations were taken the same day against `https://picor.com.ar` with `curl` and
`openssl s_client`. They are reproducible only in the sense that a live site is: the certificate
finding in particular will change the moment somebody renews it, and the date above is what makes
the observation meaningful.

Lighthouse was **not** run locally and its numbers are absent here rather than estimated. The gate
runs it in CI, non-blocking, for the reason recorded with the deviations at the top of
`.github/workflows/gate.yml`.

---

## 1. What the gate found — 53 findings

### `check-config` — 18

| # | Finding |
|---|---|
| 1 | `analytics-config.js:1` — tag container id as a literal |
| 2 | `analytics.js:2` — tag container id as a literal |
| 3–9 | 7 × messaging link `wa.me/…` as a literal (`index.html` ×6, `flyer-b2b.html` ×1) |
| 10 | `index.html:816` — mailto address as a literal |
| 11 | `analytics.js:2` — still contains the tag-container placeholder |
| 12–17 | 6 × "unanswered marker" inside three **PNG binary files** — *not violations; see below* |
| 18 | a form exists but `config.receiver.endpoint` is null |

### `check-markup` — 9

| # | Finding |
|---|---|
| 1, 3 | no skip link (`index.html`, `flyer-b2b.html`) |
| 2, 4 | an `<img>` declares no intrinsic width/height |
| 5 | `style.css` — a full-height rule uses `vh`, not `dvh` |
| 6 | an element fixed to the bottom edge ignores the safe area |
| 7, 8 | form controls at 15.2px and 14.4px — below the 16px no-zoom floor |
| 9 | no minimum interactive target size declared |

### `check-assets` — 26

| # | Finding |
|---|---|
| 1–16 | 16 × byte budget: 11 images over 300 KB, 5 of them photographs in a lossless format. The three `education-*.png` weigh **7.4–9.4 MB each** |
| 17 | `index.html` references **31.58 MB** against a 2 MB budget — 15× over |
| 18–21 | 4 × **referenced but not committed** — all in `flyer-b2b.html`: `campo-surcos.jpeg`, `logo-pepper.svg`, `producto-detalle.jpeg`, `sin-tacc-logo.jpg` |
| 22, 23 | 2 × committed but referenced from nowhere — published at a URL for no reason |
| 24–26 | 3 × third-party origin contacted on first render: `fonts.googleapis.com` ×2, `fonts.gstatic.com` ×1 |

### Known instrument error — findings 12–17 of `check-config`

`check-config`'s placeholder scan walks **every** file and splits it into lines, including binary
ones. The three `education-*.png` files contain the three-letter unanswered-marker as a byte
sequence in their compressed data, six times between them. The identifier scan directly above it in
the same file filters to `.html`, `.js` and `.css`; the placeholder scan does not.

These are **not violations**. They are the check firing on correct input — which §20 names as worse
than no check, because it teaches people to route around the gate.

They are nonetheless **left in the raw count and in `.gate-baseline.json` exactly as the instrument
produced them.** A measurement is not hand-corrected; it is annotated. Adjusting the number here to
what it "should" have been would make this document unreproducible from the command in *Method*,
which is the one property that lets anybody check it. The fix belongs in the handbook repository —
the check is hash-pinned here precisely so nobody patches it locally — and the triage that follows
records where this sits.

Practically: the six entries drop out on their own when those images are re-encoded.

---

## 2. What the gate cannot see — 13 findings

The delivery gate reads the repository. These came from the live site and from reading the
architecture, and **no automated check in this repository will ever raise them.** That is the point
of writing them down.

| # | Finding | Evidence |
|---|---|---|
| 1 | **The TLS certificate expired 2026-07-09.** Every visitor has been getting a browser interstitial for 33 days | `openssl s_client`: `notAfter=Jul 9 19:59:54 2026 GMT` |
| 2 | **Plain HTTP is served 200 with no redirect to HTTPS** | `curl -I http://picor.com.ar/` → `200 OK` |
| 3 | **No security headers at all** — no CSP, HSTS, framing control, `X-Content-Type-Options`, `Referrer-Policy` or `Permissions-Policy` | live response headers |
| 4 | **`www.picor.com.ar` also serves 200** — two origins, same content, no redirect between them | `curl -I https://www.picor.com.ar/` |
| 5 | **No privacy statement exists**, while the form collects name, email, telephone and a free-text message | no `privacy.html`; nothing links to one |
| 6 | **The form persists nothing.** It composes a WhatsApp message, calls `window.open`, and shows its success state unconditionally | `index.html:1113-1140` |
| 7 | **The success state can be a lie.** If `window.open` is blocked — an in-app browser, a popup blocker — the visitor is told "Se abrió WhatsApp con tu mensaje" and nothing was sent | same handler; no return-value check |
| 8 | **An intent is recorded as an outcome.** `generate_lead` fires on the departure to WhatsApp, not on any arrival | `index.html:1131`, `:1158` |
| 9 | **The email waitlist field feeds no list.** "Dejanos tu mail y te avisamos" collects an address and forwards it as WhatsApp text — no confirmed opt-in, no unsubscribe, no consent record | `index.html:1147-1165` |
| 10 | **Consent was never decided.** The tag container loads unconditionally on first render | `analytics.js`; no consent default |
| 11 | **The publication origin is a manual upload**, not a pipeline. Nothing can refuse a bad publish | `Last-Modified` matches the last local edit; no workflow existed |
| 12 | **Internal documentation is published.** `GTM_SETUP.md` returns 200 at the public URL — the repository is the web root | `curl -I https://picor.com.ar/GTM_SETUP.md` |
| 13 | **No published not-found document.** A wrong URL gets Apache's default error page | `curl https://picor.com.ar/no-existe-xyz` |

### Two findings that are gone before they can be fixed

§26: *measurement findings are not recoverable.* Recording these as "to do" would be a lie about
what is achievable.

- **Finding 8** — the four months of `generate_lead` already recorded cannot be reclassified.
  Renaming the event today fixes tomorrow's data. There is no second source to reconstruct April to
  August from, because the only system that saw those visitors is the one that mislabelled them.
- **Finding 1** — the traffic lost to the certificate interstitial since 9 July is not measurable
  either, and it is not in analytics: those visitors never executed the container.

The entries record the **gap in the history**, not a plan to fill it.

---

## 3. Triage — where every finding went

Every one of the 66 findings is in **exactly one** bucket. A finding with no bucket is the one that
later becomes an argument.

| Bucket | Entries | Findings | Where it lives |
|---|---|---|---|
| **Fix now** | 4 | 6 | Fixed during this adoption — see below and the commits that follow |
| **Debt** | 14 | 49 | [`technical-debt.md`](technical-debt.md) — each with a reason, a cost, **a trigger** and an owner |
| **Inapplicable** | 3 | 6 | [`open-definitions.md`](open-definitions.md) — with the reason, never silently skipped |
| **Blocked on a decision** | 4 | 5 | [`open-definitions.md`](open-definitions.md) — with the default that holds while open |
| | **25** | **66** | |

### The fix-now bucket, and why only these four

The test is **contract-sensitive and cheap** — not "small". These are defects that were always
defects; the rule only made them visible. Carrying one is not a slower fix, it is an open hole.

| # | What | Why it is not debt |
|---|---|---|
| **FIX-01** | The TLS certificate expired 2026-07-09; plain HTTP is served with no redirect | The site is *effectively down* for any visitor who heeds the browser warning, and has been for 33 days. Nothing else on this list matters while this is true |
| **FIX-02** | No privacy statement, while the form collects name, email, telephone and free text | A disclosure obligation does not wait for a consent decision. §26: a privacy statement is required **in every case**, regardless of what was decided about tracking |
| **FIX-03** | The form's success state is shown whether or not the handoff happened | It tells the visitor they are done and tells the business nothing. §26: *a confirmation for an unsent message is worse than no confirmation.* In an in-app browser — where much of this traffic arrives — `window.open` is exactly what fails |
| **FIX-04** | `generate_lead` fires on the departure to WhatsApp | Measurement is irreversible. Every day it stays, more history is recorded under a name that overstates it, and none of it can be recomputed later. "Later" costs strictly more here, which is the fix-now test |

**Deliberately not in this bucket, though it is cheap:** the missing skip link (DEBT-05). It is a
real §6c violation and takes two lines, but it is an access barrier rather than an open hole — the
bucket test is contract-sensitive **and** cheap, and cheapness alone does not qualify. Putting it
here would widen the bucket until it means "everything easy", which is how the rewrite nobody funds
begins.

**FIX-01 is not repairable from this repository.** It is a hosting action — renewing a certificate
and adding a redirect on the current host, or completing the migration recorded in OPEN-03. It is
recorded here as fix-now because that is the bucket it belongs in, and it is escalated to its owner
rather than quietly downgraded to debt because nobody with the access was in the room.

## What to be suspicious of

If this gate ever goes green while `technical-debt.md` still has open entries, something was
silenced rather than fixed. Check `git log -p scripts/` and `.gate-baseline.json` before believing
it — `scripts/.vendored.sha256` exists to make the first of those checks unnecessary.
