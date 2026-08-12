# Brief — Picor

**Version 0.1 · 2026-08-11 · Owner: Juan Torresel**

Written at adoption, four months after the site went live — so this is a **reconstruction**, not the
input that produced the site. Where a decision was never taken, this file says so rather than
inventing the one that would explain the result. A decision inferred backwards from the code and
recorded as if it had been made is the worst thing this file could contain.

Anything marked **assumed** below was read out of the repository or off the live site by the agent
running the adoption. None of it has been confirmed by a person.

---

## 1. Decided — do not re-litigate

| Decision | What was decided | Who | When |
|---|---|---|---|
| Canonical domain | `picor.com.ar`, declared in `<link rel="canonical">` and the sitemap | Juan Torresel | before 2026-04 |
| Hosting, and what it puts out of reach | **Never taken as a decision.** Apache shared hosting at `200.58.111.96`, deploy by manual upload. See OPEN-03 | — | — |
| Primary conversion | **Never taken.** The site fires `generate_lead` on a departure to WhatsApp, which is an intent recorded as an outcome. See FIX-05 / OPEN-02 | — | — |
| Copy language and register | Spanish (es-AR), informal *vos*. Consistent throughout, evidently deliberate | Juan Torresel | before 2026-04 |

### The six irreversibles

Everything else is refactorable. These are not. **Four of six were never answered**, and that is the
single most important fact in this file — they are irreversible precisely because answering them
late does not recover what was lost.

| # | Decision | Answer | Owner |
|---|---|---|---|
| 1 | Measurement contract and container | Container `GTM-W92XXRSR` exists and fires. **No contract was written**, and the events that exist name a departure as an outcome. The four months already elapsed cannot be recomputed | Juan Torresel |
| 2 | Consent — jurisdiction, decision, **and what would change it** | **Unanswered.** Tags load unconditionally; no privacy statement exists. OPEN-01 | Juan Torresel |
| 3 | Canonical identity: domain, mailbox, brand | Answered: `picor.com.ar`, `info@picor.com.ar`, Picor | Juan Torresel |
| 4 | Retired URLs and the redirect plan | **Unanswered**, and probably vacuous — no evidence of a predecessor site. Confirm before assuming it is nothing | Juan Torresel |
| 5 | Sender authentication (if there will be email) | **Unanswered.** No email is sent by the site today; the mailbox is a `mailto:` only. Becomes urgent the day a mailing list is built — see FIX-03 | Juan Torresel |
| 6 | Conversion receiver, with a tested reply | **Unanswered, and the form is live anyway.** It persists nothing. FIX-03 / OPEN-02 | Juan Torresel |

### The measurement contract

Written before the code that emits it — which did not happen here. **The table below is the target,
not the current state.** What the site emits today is in the right-hand column.

| Event | Type | The question it answers | What the site emits today |
|---|---|---|---|
| `contact_form_submitted` | outcome | Did the primary conversion happen? | Nothing. There is no outcome to record, because nothing is persisted |
| `messaging_intent` | **intent** | Which control sends people to messaging? | `generate_lead` and `cta_click` — an outcome name on a departure |
| `file_download` | intent | Which prospects take the technical sheet? | `file_download`. Correct as named |

**Outcome or intent is not a naming preference.** Anything completing outside this site can be
observed leaving and never arriving. `generate_lead` currently counts everyone who opened WhatsApp,
including everyone who then closed it — a headline number inflated by a margin nobody can estimate.

**The four months already recorded cannot be fixed.** Renaming the event today does not reclassify
the history, and there is no second source to reconstruct it from. That is why measurement is an
irreversible and why FIX-05 changes the name but the baseline records the gap.

---

## 2. Pending — with an owner and what it blocks

| Item | What it blocks | Owner | Due |
|---|---|---|---|
| **The TLS certificate expired 2026-07-09** | Everything. Visitors get a browser interstitial today | Juan Torresel | Immediately — FIX-01 |
| Where the site is actually hosted, and under whose account | OPEN-03, the redirect plan, `.htaccess`, and the exit path below | Juan Torresel | Before any hosting change |
| Whether a real form receiver will exist | OPEN-02. Until answered, the form claims a delivery it cannot guarantee | Juan Torresel | Before the next campaign |
| Consent decision for Argentina | OPEN-01 | Juan Torresel | With FIX-02 |

---

## 3. Assumed — nobody validated these

The most dangerous section, because an assumption reads exactly like a decision six weeks later.

| Assumption | Who would confirm it | What breaks if it is wrong |
|---|---|---|
| The site is deployed by manual upload from a machine, not by any pipeline | Juan Torresel | The whole of OPEN-03 is misdiagnosed; there may be an automation nobody documented |
| `flyer-b2b.html` is a private link handed to prospects, not a page meant to be found | Juan Torresel | It carries `noindex` and is in no sitemap — correct if intentional, an orphan page if not |
| `Ficha_Tecnica_Picor.pdf` is meant to be public | Juan Torresel | The repository is the web root; it is downloadable by anyone who guesses the URL |
| There was no predecessor site with indexed URLs | Juan Torresel | Irreversible #4 is not vacuous, and every retired URL is a 404 today |
| The WhatsApp number and mailbox are monitored by a person | Juan Torresel | Every conversion path on the site terminates nowhere |

---

## 4. Do not do

The specific mistakes already identified for *this* site.

- **Do not make the gate green.** It is red-by-baseline on purpose. Silencing a check removes the
  rule for tomorrow's code too.
- **Do not re-run `ratchet.mjs --init`.** It refuses when a baseline exists, and working around that
  refusal silently accepts everything added since.
- **Do not "fix" the WhatsApp form by adding a success animation.** The problem is that nothing is
  persisted, not that the feedback is unconvincing.
- **Do not add a cookie banner before the consent decision is taken** (OPEN-01). A banner that
  changes nothing about when tags load is decoration, and it is worse than none: it asserts a
  control that does not exist.
- **Do not allowlist the font origins in `config.js`** to clear DEBT-03. Self-hosting the typefaces
  removes the finding outright and is faster; allowlisting converts a finding into a decision nobody
  took.
- **Do not compress the three 8-10 MB PNGs by re-saving them as PNG.** They are photographs. The
  format is the defect.

---

## Corrections

A reversed conclusion is struck through and explained, never deleted.

| Initial conclusion | Correction | What triggered it |
|---|---|---|
| The site is hosted on GitHub Pages, like the template assumes | It is not. `has_pages: false`, and the live origin answers `Server: Apache` from an Argentine address | Querying the GitHub API and the live site during adoption |

---

## External configuration inventory

Parts of this system live in a provider's web interface and are invisible to version control. The
inventory is the only record. **Every "unknown" below is a piece nobody can currently hand over.**

| Provider | Object | Identifier | What it does | Restricted to our origin? |
|---|---|---|---|---|
| Google Tag Manager | Container | `GTM-W92XXRSR` | Loads measurement | **Unknown — not verified** |
| Google Analytics | Property | Unknown | Receives the events | Unknown |
| WhatsApp Business | Number | `+54 9 11 3430-0029` | Every conversion path | N/A |
| Instagram | Profile | `@picor.arg` | Linked from the footer | N/A |
| Hosting | Apache, `200.58.111.96` | Unknown account | Serves the site | N/A |
| Registrar | `picor.com.ar` | Unknown account | The domain | N/A |
| TLS | Let's Encrypt, CN `picor.com.ar` | — | **Expired 2026-07-09** | N/A |
| Google Fonts | 2 origins | — | Contacted on first render, before any consent choice | No — DEBT-03 |

## Ownership and the exit path

A site whose pieces nobody can name is a site nobody can hand over, and the unclaimed pieces are the
ones that end up as a DNS record pointing at a resource that no longer exists.

| Piece | Who owns the account | How it transfers |
|---|---|---|
| Domain registrar | Unknown | |
| DNS zone | Unknown | |
| Repository | `makesensedigital/picor` (private) | GitHub org transfer |
| Hosting account | Unknown | |
| Analytics property | Unknown | |
| Tag container | Unknown | |
| Form receiver | Does not exist | |

Filling this table in is part of OPEN-03 and does not require any code to change.

---

## Verification before publication

The gate covers what a machine can see; these are the rest. **None has been performed on this site.**

- [ ] The gate passes, and publication came from the pipeline rather than a manual upload
- [ ] Every conversion path walked end to end, on a real phone, on mobile data
- [ ] Opened **from a link in the channel the traffic actually comes from** — Instagram's in-app
      browser is the likely one here, and `window.open` behaves differently inside it, which is
      exactly what the form's success state depends on
- [ ] The URL pasted into WhatsApp and Instagram, and the preview card looked at
- [ ] Events seen arriving in the measurement tool's live view, with intent and outcome distinct
- [ ] Sitemap submitted; structured data validated
- [ ] Keyboard-only walkthrough of every interactive element
- [ ] Sector-specific legal requirements present — this is food; check what the labelling and
      allergen claims (`SIN TACC`) require to be shown and by whom they are certified
