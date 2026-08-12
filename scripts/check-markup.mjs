#!/usr/bin/env node
// Indexability and the mobile render rules — Handbook §26. Node stdlib only.
//
//   node scripts/check-markup.mjs [--root .]
//
// WHY THESE ARE ONE CHECK
//
// They share a property: every one of them passes on a development machine and fails on a phone or
// in a crawler. None of them produces an error anybody sees. A page whose hero is measured in `vh`
// renders perfectly in a desktop browser; a conversion control that resolves to its own page looks
// like a working button.

import { reporter, read, walk } from "./lib.mjs";
import { relative, join } from "node:path";

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const ROOT = arg("--root", ".");
const r = reporter("check-markup");

const files = await walk(ROOT);
const html = files.filter((f) => f.endsWith(".html"));
const css = files.filter((f) => f.endsWith(".css"));

// ---------------------------------------------------------------- indexability
for (const file of html) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const text = await read(file);
  const indexable = !/<meta\s+name="robots"[^>]*content="[^"]*noindex/i.test(text);

  // One h1, and the outline never skips a level. It is what a screen reader announces and what an
  // extractor reads; a jump from h1 to h3 loses the relationship both depend on.
  const headings = [...text.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  const h1s = headings.filter((h) => h === 1).length;
  if (h1s !== 1) {
    r.fail(
      `${rel} — ${h1s} top-level headings`,
      "exactly one h1 per document; it is the page's subject and both a screen reader and an extractor treat it as such",
    );
  }
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) {
      r.fail(
        `${rel} — heading order skips h${headings[i - 1]} → h${headings[i]}`,
        "never skip a level; style with CSS rather than by choosing a smaller tag",
      );
      break;
    }
  }

  if (indexable) {
    // A canonical is required on every indexable page. The social set is required only once the
    // page declares ANY of it: a privacy page with no card is a choice, and a page with a title
    // and no image is a broken card. Demanding the full set everywhere would be a check firing on
    // correct input, which teaches people to route around it (§20).
    const declaresSocial = /<meta\s+property="og:/i.test(text);
    const required = [["canonical", /<link\s+rel="canonical"\s+href="([^"]+)"/i]];
    if (declaresSocial) {
      required.push(
        ["og:image", /<meta\s+property="og:image"\s+content="([^"]+)"/i],
        ["og:url", /<meta\s+property="og:url"\s+content="([^"]+)"/i],
      );
    }

    for (const [what, re] of required) {
      const m = re.exec(text);
      if (!m) {
        r.fail(
          `${rel} — declares social metadata but has no ${what}`,
          `add ${what} as an absolute URL; a partial card is a broken card, and a scraper shows whatever is missing as nothing`,
        );
      } else if (!/^https?:\/\//i.test(m[1])) {
        r.fail(
          `${rel} — ${what} is relative: ${m[1]}`,
          "use the absolute URL built on config.canonicalOrigin; scrapers do not resolve relative values",
        );
      } else if (/\s/.test(m[1])) {
        r.fail(`${rel} — ${what} contains an unencoded space`, "percent-encode the URL, or rename the asset");
      }
    }

    // The text a visitor needs in order to convert must be SERVED. Generated in the browser it
    // costs deferred rendering for search and everything for generative retrieval, whose crawlers
    // largely do not execute script.
    const body = text.slice(text.indexOf("<body"));
    const withoutScripts = body.replace(/<script[\s\S]*?<\/script>/gi, "");
    const visible = withoutScripts
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (visible.length < 400) {
      r.fail(
        `${rel} — only ${visible.length} characters of served text outside script`,
        "move the conversion and discovery copy into the markup; with scripting off this page says almost nothing",
      );
    }
  }

  // A conversion control that resolves to the page it sits on. This is the shape a dead external
  // destination takes after somebody "fixes" it by pointing at the home page.
  const selfRefs = [...text.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/gi)].filter((m) => {
    const href = m[1];
    if (!/^https?:\/\//i.test(href)) return false;
    const canonical = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(text)?.[1];
    if (!canonical) return false;
    const norm = (u) => u.replace(/\/+$/, "").toLowerCase();
    return norm(href) === norm(canonical) && /data-analytics-event|class="[^"]*btn/.test(m[0]);
  });
  for (const m of selfRefs) {
    r.fail(
      `${rel} — a conversion control links to this page's own canonical URL`,
      "a destination that does not exist is not fixed by pointing at the home page: build the destination or remove the control",
    );
  }

  // Accessibility floors the automated pass would also catch, checked here because they are cheap
  // and because the message can name the section (§6c).
  // The skip link specifically — matched on an anchor carrying the class, not on any link to
  // #main. A page whose logo links to #main has no skip link, and the looser test passed it.
  if (!/<a\b[^>]*class="[^"]*\bskip-link\b[^"]*"[^>]*href="#/.test(text)) {
    r.fail(
      `${rel} — no skip link`,
      "add an anchor with class=\"skip-link\" targeting the main landmark, as the first focusable element; without it a keyboard user tabs the whole navigation on every page",
      "§6c",
    );
  }
  for (const m of text.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/gi)) {
    r.fail(`${rel} — an <img> has no alt attribute`, "add alt text, or alt=\"\" if the image is decorative", "§6c");
    break;
  }
  for (const m of text.matchAll(/<img\b(?![^>]*\bwidth=)[^>]*>/gi)) {
    r.fail(
      `${rel} — an <img> declares no intrinsic width/height`,
      "declare width and height so the image reserves its space and the page does not shift as it loads",
    );
    break;
  }
  for (const m of text.matchAll(/<button\b[^>]*aria-controls=[^>]*>/gi)) {
    if (!/aria-expanded=/.test(m[0])) {
      r.fail(`${rel} — a disclosure button has aria-controls but no aria-expanded`, "add aria-expanded and keep it in sync", "§6c");
    }
  }
}

// ---------------------------------------------------------------- the four render rules
const styles = (await Promise.all(css.map(read))).join("\n");
const styleNames = css.map((f) => relative(ROOT, f).replace(/\\/g, "/")).join(", ") || "(no stylesheet)";

// 1 — viewport units that survive retracting browser chrome.
const badVh = [...styles.matchAll(/(?:min-height|height)\s*:\s*\d+vh\b/g)];
if (badVh.length) {
  r.fail(
    `${styleNames} — ${badVh.length} full-height rule(s) use vh`,
    "use dvh: with vh the browser chrome on a phone makes the section taller than the visible viewport, so the call to action is below the fold on first render",
  );
}

// 2 — the safe area, on anything fixed to the bottom edge.
const fixedBottom = [...styles.matchAll(/\{[^}]*position\s*:\s*fixed[^}]*\}/g)].filter((m) =>
  /bottom\s*:\s*0/.test(m[0]),
);
for (const block of fixedBottom) {
  if (!/safe-area-inset-bottom/.test(block[0])) {
    r.fail(
      `${styleNames} — an element fixed to the bottom edge does not respect the safe area`,
      "add env(safe-area-inset-bottom) to its bottom padding; this is where the conversion control lives and it otherwise sits under the device's gesture bar",
    );
    break;
  }
}

// 3 — form controls at 16px or larger.
const controlBlocks = [...styles.matchAll(/\{[^}]*font-size\s*:\s*([\d.]+)(px|rem)[^}]*\}/g)];
const inputRule = /(^|[,\s>])(input|textarea|select)\b/;
for (const m of controlBlocks) {
  const start = styles.lastIndexOf("}", m.index) + 1;
  const selector = styles.slice(start, m.index);
  if (!inputRule.test(selector)) continue;
  const px = m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]);
  if (px < 16) {
    r.fail(
      `${styleNames} — form controls are set to ${m[1]}${m[2]} (${px}px)`,
      "16px or larger: below it iOS zooms the page on focus and throws the visitor out of position in the middle of the form",
    );
  }
}

// 4 — interactive targets at 44px with spacing.
if (!/--tap-min|min-height:\s*44px/.test(styles)) {
  r.fail(
    `${styleNames} — no minimum interactive target size is declared`,
    "declare a 44px minimum for interactive elements and space adjacent targets apart",
  );
}

r.finish(`${html.length} documents, ${css.length} stylesheets`);
