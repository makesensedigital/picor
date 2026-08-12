#!/usr/bin/env node
// The ratchet — Handbook §26, and the `adopt-an-existing-repository` skill. Node stdlib only.
//
//   node scripts/ratchet.mjs --init      record today's violations as the baseline
//   node scripts/ratchet.mjs             fail if any of them increased
//   node scripts/ratchet.mjs --update    lower the baseline after fixing something
//
// WHY THIS EXISTS
//
// A site that already exists violates these rules on the day they arrive — often in dozens of
// places, none of which were mistakes when they were written. That leaves two bad options and one
// good one.
//
//   A gate that fails on everything  → red forever, switched off within a week.
//   A gate with the rules disabled   → nothing stops the next violation being added.
//   A ratchet                        → what exists is recorded; what is NEW fails.
//
// The repository therefore stops getting worse immediately, which is the property that actually
// matters, and improves at whatever rate the work is funded — without ever reporting that it
// complies when it does not.
//
// WHAT IT COUNTS, AND WHY NOT JUST A TOTAL
//
// The baseline is keyed by **check and file**, not by a single number per check. A total is
// defeated by the most ordinary sequence there is: fix one violation, add another, the number is
// unchanged and the gate passes. Keying by file catches that whenever the two are in different
// files, which is the common case, and costs one extra field.
//
// It is still not identity: two violations in the same file remain interchangeable. That is a
// deliberate stopping point rather than an oversight — keying on line numbers makes the baseline
// churn on every edit, and keying on message text makes it churn every time a message improves.
//
// FROZEN, ON PURPOSE
//
// The shape below is not going to be refined further from reasoning. Every remaining question about
// it — whether the file is the right key, whether a fall should block until the baseline is
// lowered, how noisy `--update` is in practice — is a question about how it behaves when somebody
// is actually using it under a deadline, and answering those from a chair produces a more elaborate
// mechanism that is wrong in the same places.
//
// So it changes when a real adoption moves it, and the change carries what happened. Until then,
// resist improving it.
//
// A NEW SITE NEEDS NONE OF THIS. With no baseline file the ratchet does nothing and says so: a
// site built from this template starts compliant, and recording a baseline of zero would only
// invite somebody to raise it.

import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));

const arg = (n, d = null) => {
  const i = process.argv.indexOf(n);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const ROOT = resolve(arg("--root", "."));
const INIT = process.argv.includes("--init");
const UPDATE = process.argv.includes("--update");
const BASELINE = join(ROOT, ".gate-baseline.json");

// `build-derived --check` is deliberately absent: derived files drifting from their source is never
// something to carry, and fixing it is one command. A ratchet is for what is expensive to fix.
const CHECKS = ["check-config.mjs", "check-markup.mjs", "check-assets.mjs"];

/** The file a finding is about, taken from the start of its message. */
const fileOf = (what) => {
  const head = String(what).split(" — ")[0].trim();
  const path = head.replace(/:\d+$/, "");
  // A finding with no path — "a form exists but the receiver is null" — is about the repository
  // rather than a file, and is bucketed as such rather than dropped.
  return /[./]/.test(path) && !path.includes(" ") ? path : "(repository)";
};

const collect = async () => {
  const counts = {};
  for (const check of CHECKS) {
    const { stdout } = await run(process.execPath, [join(HERE, check), "--root", ROOT, "--json"], {
      cwd: ROOT,
      maxBuffer: 8 * 1024 * 1024,
    });
    const line = stdout.trim().split("\n").filter(Boolean).pop();
    const result = JSON.parse(line);
    for (const f of result.failures) {
      const key = `${result.check}|${fileOf(f.what)}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
};

const readBaseline = async () => {
  try {
    return JSON.parse(await readFile(BASELINE, "utf8"));
  } catch {
    return null;
  }
};

const writeBaseline = async (counts, note) => {
  const body = {
    "//": note,
    "//how": "Keyed by check and file. Run `node scripts/ratchet.mjs --update` after fixing something, in the same commit as the fix.",
    recorded: Object.keys(counts).length ? counts : {},
  };
  await writeFile(BASELINE, JSON.stringify(body, null, 2) + "\n", "utf8");
};

const total = (c) => Object.values(c).reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------- run
const current = await collect();
const file = await readBaseline();
const baseline = file?.recorded ?? null;

if (INIT) {
  if (baseline) {
    process.stdout.write(
      "ratchet: a baseline already exists. Use --update to lower it after a fix; re-recording it " +
        "from scratch would silently accept anything added since.\n",
    );
    process.exitCode = 1;
  } else {
    await writeBaseline(
      current,
      "Violations present when this repository adopted the standard. Existing entries are carried; anything NEW fails the gate. Lower an entry in the same commit that fixes it — never raise one.",
    );
    process.stdout.write(
      `ratchet: baseline recorded — ${total(current)} findings across ${Object.keys(current).length} file(s).\n` +
        "Commit it. From here the gate fails on anything new, and this file only ever goes down.\n",
    );
  }
} else if (!baseline) {
  // The normal case for a site built from this template.
  process.stdout.write(
    "ratchet: no baseline — nothing to ratchet against, and a compliant site needs none.\n" +
      "If this repository is adopting the standard with violations already present, run --init.\n",
  );
} else {
  const keys = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort();
  const risen = [];
  const fallen = [];

  for (const key of keys) {
    const was = baseline[key] ?? 0;
    const now = current[key] ?? 0;
    if (now > was) risen.push({ key, was, now });
    else if (now < was) fallen.push({ key, was, now });
  }

  for (const { key, was, now } of fallen) {
    const [check, where] = key.split("|");
    process.stdout.write(`  ↓ ${check} on ${where}: ${was} → ${now}\n`);
  }
  if (fallen.length && !UPDATE) {
    process.stdout.write(
      "\nratchet: findings went down. Run `node scripts/ratchet.mjs --update` and commit the\n" +
        "         baseline WITH the fix — otherwise the ratchet keeps the old headroom and the\n" +
        "         violation you just removed can come back for free.\n",
    );
  }

  for (const { key, was, now } of risen) {
    const [check, where] = key.split("|");
    process.stdout.write(
      `\nFAIL  ${check} on ${where}: ${was} → ${now}\n` +
        `      fix: this change adds a violation that did not exist. Existing ones are carried on\n` +
        `           purpose; new ones are not. Fix it, or if it is genuinely unavoidable say so in\n` +
        `           the pull request and raise it deliberately — never by re-running --init.\n` +
        `      rule: Handbook §26 · skill adopt-an-existing-repository\n`,
    );
  }

  if (UPDATE && !risen.length) {
    await writeBaseline({ ...current }, file["//"]);
    process.stdout.write(`\nratchet: baseline lowered to ${total(current)} findings. Commit it with the fix.\n`);
  }

  process.stdout.write(
    `\nratchet: ${total(current)} findings against a baseline of ${total(baseline)} · ` +
      `${risen.length} increased · ${fallen.length} decreased\n`,
  );
  if (risen.length) process.exitCode = 1;
}
