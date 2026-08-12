#!/usr/bin/env node
// Byte budgets, formats, orphans and third-party origins — Handbook §26. Node stdlib only.
//
//   node scripts/check-assets.mjs [--root .]
//
// THE BUDGET IS NOT ONLY ABOUT SPEED
//
// On a storage host with a monthly transfer allowance, page weight is availability: a document that
// ships tens of megabytes exhausts a free tier in a few thousand visits. The threshold is therefore
// a merge condition rather than an aspiration — a score with no gate produces exactly the same
// software as no score at all.

import { reporter, read, walk, sizeOf, ext, loadBrowserGlobal } from "./lib.mjs";
import { relative, join, basename } from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const ROOT = arg("--root", ".");
const r = reporter("check-assets");

// Budgets in bytes. Tighten them per site; never loosen one without recording why.
const BUDGET = {
  perImage: 300 * 1024,
  perDocument: 2 * 1024 * 1024, // markup + styles + scripts + every image it references
  perStylesheet: 100 * 1024,
  perScript: 60 * 1024,
};

const IMAGE = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg"]);
const LOSSLESS_PHOTO = new Set([".png"]);

// Loaded once, up front: both the reference resolver and the third-party scan need the canonical
// origin, and reading it twice is a second copy of the same fact.
const config = await loadBrowserGlobal(join(ROOT, "config.js"), "SITE_CONFIG");
const ownOrigin = String(config.canonicalOrigin || "").replace(/\/+$/, "");

const files = await walk(ROOT);
const html = files.filter((f) => f.endsWith(".html"));

// ---------------------------------------------------------------- per-asset budget and format
for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const e = ext(file);
  const size = await sizeOf(file);

  if (IMAGE.has(e) && e !== ".svg" && size > BUDGET.perImage) {
    r.fail(
      `${rel} — ${(size / 1024).toFixed(0)} KB exceeds the ${(BUDGET.perImage / 1024).toFixed(0)} KB per-image budget`,
      "re-encode at the size it is actually displayed, in a modern format, with a fallback via <picture>",
    );
  }
  if (e === ".css" && size > BUDGET.perStylesheet) {
    r.fail(`${rel} — stylesheet is ${(size / 1024).toFixed(0)} KB`, "split or trim it; it blocks the first render");
  }
  if (e === ".js" && !rel.startsWith("scripts/") && size > BUDGET.perScript) {
    r.fail(`${rel} — script is ${(size / 1024).toFixed(0)} KB`, "trim it, or defer what is not needed for the first render");
  }

  // A photograph in a lossless format is the single most expensive mistake available here, and it
  // is invisible: the page looks identical and weighs ten times what it should.
  if (LOSSLESS_PHOTO.has(e) && size > 500 * 1024) {
    r.fail(
      `${rel} — ${(size / 1024).toFixed(0)} KB in a lossless format`,
      "photographic content is never PNG; use a lossy modern format with a fallback",
    );
  }
}

// ---------------------------------------------------------------- per-document budget + orphans
const referenced = new Set();
for (const file of html) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const text = await read(file);
  let total = Buffer.byteLength(text);

  for (const m of text.matchAll(/(?:href|src|content)="\/?([^":?]+\.(?:css|js|png|jpe?g|webp|avif|gif|svg|woff2?))(?:\?[^"]*)?"/gi)) {
    const target = m[1].replace(/^\.\//, "");
    referenced.add(target);
    const onDisk = files.find((f) => relative(ROOT, f).replace(/\\/g, "/") === target);
    if (onDisk) total += await sizeOf(onDisk);
  }

  if (total > BUDGET.perDocument) {
    r.fail(
      `${rel} — ${(total / 1024 / 1024).toFixed(2)} MB of referenced weight exceeds the ${(BUDGET.perDocument / 1024 / 1024).toFixed(0)} MB budget`,
      "on a storage host with a transfer allowance this is availability, not only speed: reduce it or record the raised budget with its reason",
    );
  }
}

// Also referenced from the manifest-style control files and from scripts that build markup.
//
// A remote URL is NOT a local reference, and the distinction is not pedantic: the measurement
// script builds a container URL by concatenating `"https://…/gtm.js?id="`, and a pattern that only
// looks at the filename reads that as a missing local file. That false positive was found by the
// clean-run assertion, which is exactly what it is for.
const REFERENCE = /["']([^"']*\.(?:css|js|png|jpe?g|webp|avif|gif|svg|woff2?))(?:[?#][^"']*)?["']/gi;
const localise = (raw) => {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) || raw.startsWith("//")) {
    // Absolute. Only ours counts, and only as the path part — an absolute self-reference is how
    // `og:image` has to be written, so it must still register as referenced.
    if (!ownOrigin || !raw.startsWith(ownOrigin + "/")) return null;
    raw = raw.slice(ownOrigin.length);
  }
  // A string ending in a known extension is not necessarily a path. The measurement script pushes
  // an event literally named `"gtm.js"`, and reading that as a missing file is the check firing on
  // correct input. Requiring a separator is the cheap, exact distinction: every real reference here
  // is written rooted (`/styles.css`) or nested (`assets/social.png`).
  if (!raw.includes("/")) return null;
  return raw.replace(/^\.?\//, "");
};

for (const file of files.filter((f) => /\.(js|json|webmanifest|xml|txt|html)$/.test(f))) {
  const text = await read(file);
  for (const m of text.matchAll(REFERENCE)) {
    const target = localise(m[1]);
    if (target) referenced.add(target);
  }
}

// The mirror of the orphan check, and the one that costs more. An orphan wastes bytes nobody
// downloads; a reference to a file that is not there is a 404 on the live site, and it is silent —
// a missing icon renders as the browser's default, a missing social image renders as a card with a
// blank space, and neither raises anything anywhere.
//
// This was found by running the gate rather than by reading it: the template referenced two assets
// it did not ship, and the orphan check by construction could not see it because it only looks the
// other way.
for (const target of referenced) {
  const onDisk = files.some((f) => relative(ROOT, f).replace(/\\/g, "/") === target);
  if (onDisk) continue;
  r.fail(
    `${target} — referenced but not committed`,
    "add the file, or remove the reference: on the live site this is a 404 that raises nothing, and a missing icon or social image simply renders as absent",
  );
}

const NEVER_ORPHAN = new Set([
  "config.js",
  "facts.js",
  "analytics.js",
  "site.js",
  "styles.css",
  "assets/favicon.svg",
  "assets/apple-touch-icon.png",
  "assets/social.png",
]);

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  if (!IMAGE.has(ext(file)) && !/\.(css|js|woff2?)$/.test(rel)) continue;
  if (rel.startsWith("scripts/")) continue;
  if (NEVER_ORPHAN.has(rel) || referenced.has(rel)) continue;
  r.fail(
    `${rel} — committed but referenced from nowhere`,
    "delete it: in this architecture the repository is the web root, so an unreferenced file is still published at its URL",
  );
}

// ---------------------------------------------------------------- third-party origins
//
// Every origin the page contacts on FIRST RENDER, before any interaction. Each one reaches a third
// party with the visitor's address before any consent choice, and with no server there is no way to
// proxy it — the only available answer is a placeholder that loads on interaction.
const allowed = new Set(config.allowedOriginsOnFirstRender || []);

// Only tags that actually FETCH something count. A canonical link and an og:url are declarations
// about identity — they name a URL, they do not request it — and flagging them would be the check
// firing on correct input, which teaches people to route around it (§20).
const FETCHING = [
  /<script\b[^>]*\bsrc="(https?:\/\/[^/"]+)/gi,
  /<img\b[^>]*\bsrc="(https?:\/\/[^/"]+)/gi,
  /<iframe\b[^>]*\bsrc="(https?:\/\/[^/"]+)/gi,
  /<source\b[^>]*\bsrc(?:set)?="(https?:\/\/[^/"]+)/gi,
  /<link\b[^>]*\brel="(?:stylesheet|preload|preconnect|dns-prefetch|modulepreload)"[^>]*\bhref="(https?:\/\/[^/"]+)/gi,
  /<link\b[^>]*\bhref="(https?:\/\/[^/"]+)[^>]*\brel="(?:stylesheet|preload|preconnect|dns-prefetch|modulepreload)"/gi,
];

for (const file of html) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const text = await read(file);

  // Deferred and async scripts still fetch on load, so they count. What does not count is anything
  // a script only requests after an interaction — which is precisely what a click-to-load
  // placeholder is for, and why replacing an embed with one is the available remedy.
  const seen = new Set();
  for (const re of FETCHING) {
    for (const m of text.matchAll(re)) {
      const origin = m[1];
      if (!origin || origin === ownOrigin) continue;
      if (allowed.has(origin)) continue;
      if (seen.has(origin)) continue;
      seen.add(origin);
      r.fail(
        `${rel} — fetches from ${origin} on first render, and it is not in config.allowedOriginsOnFirstRender`,
        "add it to the allowlist if that is a deliberate decision, or replace the embed with a placeholder that loads it on interaction — as written it reaches a third party with the visitor's address before any consent choice, and with no server there is no way to proxy it",
      );
    }
  }
}

r.finish(`${files.length} files, ${html.length} documents`);
