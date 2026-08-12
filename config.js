// The configuration module — Handbook §26.
//
// EVERY external identifier this site uses lives here and nowhere else: the messaging number, the
// canonical domain, container ids, form ids, scheduling URLs, the contact mailbox, the asset version.
// `scripts/check-config.mjs` fails the gate on a literal for any of them found anywhere else.
//
// NOTHING HERE IS A SECRET. Everything in this file is delivered to the visitor's browser and is
// readable there. These are PUBLIC IDENTIFIERS, protected at the provider by restricting them to
// this site's origin. An identifier that cannot be restricted that way does not belong in a static
// site at all (§26; §4 is sharpened here, not relaxed).
//
// ---------------------------------------------------------------------------------------------
// ADOPTION NOTE — READ BEFORE ASSUMING THIS FILE IS IN FORCE.
//
// This site predates the standard. This module was written during adoption to DECLARE the
// identifiers the site already uses, so the gate has something to measure against. No document
// loads it yet: `index.html` and `flyer-b2b.html` still carry these values as literals, which is
// exactly what `check-config` counts and what the ratchet baseline carries.
//
// So until DEBT-01 is paid, this file is the DECLARATION and the markup is the SOURCE OF TRUTH.
// That is a duplication, it is recorded as such, and it is the state adoption starts from rather
// than the state it ends in. Changing a number here changes nothing that is served.
// ---------------------------------------------------------------------------------------------

(function (root) {
  const CONFIG = {
    // -------------------------------------------------------------------- identity
    // The canonical origin, with protocol and no trailing slash.
    canonicalOrigin: "https://picor.com.ar",

    // -------------------------------------------------------------------- contact
    // Messaging number in international format, digits only — no +, no spaces, no dashes.
    messagingNumber: "5491134300029",
    contactMailbox: "info@picor.com.ar",

    // One template per conversion control, keyed by the control's analytics label, so the visible
    // control, the event it emits and the text it composes cannot drift apart. The composed text is
    // the ENTIRE context the business receives (§26).
    //
    // Four of the six messaging controls in `index.html` compose NO text today — they open an empty
    // conversation. The templates below are therefore the intended state, not the current one; see
    // DEBT-02. The two that do compose text are built in the page's inline script.
    messages: {
      hero_restaurante:
        "Hola Picor — soy de un restaurante y quiero conocer el gochugaru.",
      whatsapp_contacto: "Hola Picor — quiero hacerles una consulta.",
      whatsapp_footer: "Hola Picor — quiero ponerme en contacto.",
      sticky_whatsapp: "Hola Picor — quiero conocer el producto.",
      floating_whatsapp: "Hola Picor — quiero hacerles una consulta.",
    },

    // -------------------------------------------------------------------- measurement
    // The live container. Declared here; `analytics-config.js` still holds the literal the browser
    // actually reads (DEBT-01).
    tagContainerId: "GTM-W92XXRSR",

    // -------------------------------------------------------------------- consent
    // §26 requires the jurisdiction, the owner, the date and — the load-bearing half — THE
    // CONDITION THAT WOULD CHANGE THE ANSWER.
    //
    // NOT DECIDED. The site has shipped for four months with the tag container loading
    // unconditionally and no privacy statement, which is a decision taken by default rather than
    // one taken. Recorded as OPEN-01 with the default that holds while it is open.
    //
    // NOTE THE ARCHITECTURAL LIMIT, which is not a setting: a static site CANNOT produce auditable
    // PROOF of consent. The record lives in the visitor's browser — that is state, not evidence.
    consent: {
      mode: "notice-only",
      jurisdiction: "Argentina — Ley 25.326. Not confirmed by anyone; see OPEN-01",
      decidedBy: null,
      decidedOn: null,
      revisitWhen:
        "the site advertises or sells into the EU or another jurisdiction requiring prior consent, " +
        "special-category data is collected, or profiling for advertising is introduced",
      privacyUrl: null, // no privacy statement exists — FIX-02
    },

    // -------------------------------------------------------------------- conversion receiver
    // Where a submitted form is PERSISTED. §26: every conversion path terminates in a system the
    // business controls, and the record is written BEFORE any handoff to an external channel.
    //
    // `null` here is NOT the benign case. This site presents a form, and that form persists
    // nothing: it composes a WhatsApp message, calls `window.open`, and shows a success state
    // whether or not the window opened. See FIX-03 and OPEN-02.
    receiver: {
      endpoint: null,
      owner: null,
      originRestricted: false,
    },

    // -------------------------------------------------------------------- third parties
    // Every origin this page is ALLOWED to contact on FIRST RENDER, before any interaction.
    //
    // This list is the DECLARED state, and it is deliberately not the current one. The two font
    // origins are contacted on first render today; they are listed as debt (DEBT-03) rather than
    // allowlisted, because self-hosting the typefaces removes them outright and is faster. Adding
    // them here would convert a finding into a decision nobody took.
    allowedOriginsOnFirstRender: ["https://www.googletagmanager.com"],

    // -------------------------------------------------------------------- assets
    // No build means no content-addressed filenames, so cache invalidation is manual. Bump this on
    // any change to a style, script or image; `?v=` is appended from here and nowhere else.
    //
    // Nothing in the markup carries `?v=` today, so there is no cache invalidation at all: a
    // returning visitor gets whatever the edge held. Starts at 1 so the first wiring bumps it.
    assetVersion: 1,
  };

  root.SITE_CONFIG = CONFIG;
})(typeof globalThis !== "undefined" ? globalThis : this);
