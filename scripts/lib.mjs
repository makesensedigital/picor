// Shared helpers for the delivery gate — Handbook §26. Node stdlib only.
//
// `config.js` and `facts.js` are browser scripts, so they cannot be imported. They are evaluated in
// a bare `node:vm` context with nothing in it — no `document`, no `fetch`, no filesystem — which
// reads the declared object without running anything that could touch the machine.

import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import vm from "node:vm";

export const read = async (path) => (await readFile(path, "utf8")).replace(/\r\n/g, "\n");

/** Evaluate a browser script in an empty sandbox and return the global it assigned. */
export const loadBrowserGlobal = async (path, name) => {
  const sandbox = {};
  vm.createContext(sandbox);
  // The module pattern in these files resolves its root from `globalThis`, which inside the
  // context is `sandbox` itself.
  vm.runInContext(await read(path), sandbox, { filename: path, timeout: 2000 });
  const value = sandbox[name];
  if (!value) throw new Error(`${path} did not assign ${name}`);
  return value;
};

/** Every file under `root`, excluding version control and the gate's own machinery. */
export const walk = async (root, skip = [".git", "node_modules", "scripts", ".github"]) => {
  const out = [];
  const visit = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (skip.includes(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else out.push(path);
    }
  };
  await visit(root);
  return out;
};

export const sizeOf = async (path) => (await stat(path)).size;
export const ext = (path) => extname(path).toLowerCase();

/**
 * A reporter every check shares, so the output reads the same whichever one failed.
 *
 * §20: a lint's message is INPUT TO THE NEXT TURN, not a report. Each failure therefore states the
 * remediation and the governing section, not only the fact.
 */
export const reporter = (checkName) => {
  const failures = [];
  const notes = [];
  // `--json` prints the findings as data instead of prose, so the ratchet can count them without
  // parsing human output. A check that has to be screen-scraped breaks the first time somebody
  // improves a message.
  const JSON_MODE = process.argv.includes("--json");

  return {
    fail: (what, fix, section = "§26") => failures.push({ what, fix, section }),
    note: (message) => notes.push(message),
    finish(summary) {
      if (JSON_MODE) {
        process.stdout.write(
          JSON.stringify({ check: checkName, summary, failures }, null, 0) + "\n",
        );
        // Deliberately exit 0 in JSON mode. The caller decides what the findings mean — during
        // adoption an existing violation is not a failure, and a check that exits non-zero anyway
        // would force the caller to distinguish "found things" from "crashed".
        return failures.length;
      }
      for (const n of notes) process.stdout.write(`  ${n}\n`);
      for (const f of failures) {
        process.stdout.write(`\nFAIL  ${f.what}\n      fix: ${f.fix}\n      rule: Handbook ${f.section}\n`);
      }
      process.stdout.write(`\n${checkName}: ${summary} · ${failures.length} failures\n`);
      if (failures.length) process.exitCode = 1;
      return failures.length;
    },
  };
};
