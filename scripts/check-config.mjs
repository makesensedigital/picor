#!/usr/bin/env node
// One configuration module, no placeholders — Handbook §26. Node stdlib only.
//
//   node scripts/check-config.mjs [--root .]
//
// Three failures, all of which have been paid for on real sites:
//
// 1. AN EXTERNAL IDENTIFIER OUTSIDE config.js. A messaging number repeated across a page is a
//    search-and-replace waiting to go wrong, and a wrong number on one of eleven buttons looks
//    exactly like a right one.
// 2. THE ASSET VERSION OUT OF STEP with the `?v=` in the markup. With no build there are no
//    content-addressed filenames, so this is the only cache invalidation there is: out of step, a
//    returning visitor gets old styles against new markup.
// 3. A PLACEHOLDER STILL IN PLACE. A tag container that is still `GTM-XXXXXXX` means the site
//    publishes without measurement — and that history cannot be reconstructed backwards, which is
//    why this fails the gate instead of warning in a console nobody reads.

import { reporter, read, walk, loadBrowserGlobal } from "./lib.mjs";
import { relative, join, basename } from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const ROOT = arg("--root", ".");

const r = reporter("check-config");
const config = await loadBrowserGlobal(join(ROOT, "config.js"), "SITE_CONFIG");

// Files that are allowed to carry identifiers: the module itself, and prose about the site.
const OWNS_IDENTIFIERS = new Set(["config.js"]);
const PROSE = new Set([".md", ".txt", ".xml"]);

// ---------------------------------------------------------------- 1. stray identifiers
//
// Each pattern is a class of identifier the module owns. Deliberately narrow: a pattern that fires
// on correct input teaches people to route around the check, which is worse than not having it.
const PATTERNS = [
  { name: "messaging link", re: /wa\.me\/\d+/g },
  { name: "tag container id", re: /\bGTM-[A-Z0-9]{4,}\b/g },
  { name: "measurement id", re: /\bG-[A-Z0-9]{8,}\b/g },
  { name: "mailto address", re: /mailto:[^\s"'<>)]+/g },
  { name: "scheduling link", re: /https?:\/\/(?:calendly|cal)\.com\/[^\s"'<>)]+/g },
];

const files = await walk(ROOT);
let scanned = 0;

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  if (OWNS_IDENTIFIERS.has(rel)) continue;
  // Generated files derive from the module by construction; the coherence check owns them.
  if (rel === "llms.txt" || rel === "sitemap.xml" || rel === "robots.txt") continue;
  if (![".html", ".js", ".css"].includes("." + rel.split(".").pop())) continue;

  const text = await read(file);
  scanned++;

  // The `noscript` tag-container fallback is the one place a container id must appear literally,
  // because it is markup a browser with no scripting reads. Allowed, and only there.
  const lines = text.split("\n");
  for (const { name, re } of PATTERNS) {
    for (const [i, line] of lines.entries()) {
      if (line.includes("check-config: allow")) continue;
      const hits = line.match(re);
      if (!hits) continue;
      if (name === "tag container id" && /<noscript|googletagmanager\.com\/ns\.html/.test(line)) continue;
      r.fail(
        `${rel}:${i + 1} — ${name} written as a literal: ${hits[0]}`,
        "move the value into config.js and reference it by key (site.js builds the destination); " +
          "if this one occurrence is genuinely unavoidable, append the comment `check-config: allow` " +
          "on the same line with the reason",
      );
    }
  }
}

// ---------------------------------------------------------------- 2. asset version
const declared = config.assetVersion;
if (typeof declared !== "number") {
  r.fail("config.assetVersion is not a number", "set it to an integer and bump it on every asset change");
} else {
  const html = files.filter((f) => f.endsWith(".html"));
  for (const file of html) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    const text = await read(file);
    for (const m of text.matchAll(/(?:href|src)="\/?([^"?]+)\?v=(\d+)"/g)) {
      if (Number(m[2]) !== declared) {
        r.fail(
          `${rel} — ${basename(m[1])} is versioned ?v=${m[2]} but config.assetVersion is ${declared}`,
          `bump both together, or a returning visitor gets a cached ${basename(m[1])} against new markup`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------- 3. placeholders
// Each carries its own remediation. A lint's message is input to the next turn, not a report, so a
// generic one ("fill it in") wastes the only moment when saying the specific thing is free (§20).
const UNFILLED = [
  {
    re: /\bTBD\b/,
    what: "an unanswered TBD",
    fix: "answer it. If it is genuinely still open, it belongs in brief.md as a pending item with an owner — not in a file that ships",
  },
  {
    re: /GTM-XXXXXXX/,
    what: "the tag container placeholder",
    fix: "set config.tagContainerId. Publishing without measurement records no history, and measurement cannot be reconstructed backwards",
  },
  {
    re: /\bexample\.com\b/,
    what: "the placeholder domain",
    fix: "set config.canonicalOrigin and re-run build-derived.mjs, which rewrites every absolute URL from it",
  },
  {
    re: /\blorem ipsum\b/i,
    what: "placeholder copy",
    fix: "write the real copy: this text is what a search result and an assistant will quote",
  },
  {
    re: /\bhello@example\b/,
    what: "the placeholder mailbox",
    fix: "set config.contactMailbox to a mailbox somebody actually reads",
  },
];

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  if (rel.startsWith("scripts/") || rel === "README.md") continue;
  const isProse = PROSE.has("." + rel.split(".").pop());
  // brief.md is where an unanswered question is SUPPOSED to live, marked as pending.
  if (rel === "brief.md") continue;

  const text = await read(file);
  // Line-based, and honouring the same escape hatch as the identifier scan above — one mechanism
  // rather than two. It matters here for a specific reason: the code that DETECTS an unconfigured
  // container has to name the placeholder to compare against it, and a check that cannot tell a
  // sentinel from the thing it detects fires on correct input.
  for (const [i, line] of text.split("\n").entries()) {
    if (line.includes("check-config: allow")) continue;
    for (const { re, what, fix } of UNFILLED) {
      if (!re.test(line)) continue;
      // A derived file inherits its placeholders from its source, so the remediation is the source.
      const derived = ["llms.txt", "robots.txt", "sitemap.xml"].includes(rel);
      r.fail(
        `${rel}:${i + 1} — still contains ${what}`,
        derived ? `${fix} (this file is derived — fix the source, not this)` : fix,
      );
    }
  }
}

// ---------------------------------------------------------------- 4. the receiver
if (!config.receiver || (!config.receiver.endpoint && (await hasForm(files)))) {
  r.fail(
    "a form exists but config.receiver.endpoint is null",
    "point it at a receiver that persists the record and notifies a named owner — or remove the " +
      "form, because a control that persists nothing is not a form",
  );
}
if (config.receiver && config.receiver.endpoint && config.receiver.originRestricted !== true) {
  r.fail(
    "config.receiver.endpoint is set but originRestricted is not true",
    "restrict the endpoint to the canonical origin in the provider's console, then set the flag — " +
      "an identifier delivered to the browser is public and is protected only at the provider",
  );
}

async function hasForm(all) {
  for (const f of all.filter((x) => x.endsWith(".html"))) {
    if (/<form\b/.test(await read(f))) return true;
  }
  return false;
}

r.finish(`${scanned} files scanned`);
