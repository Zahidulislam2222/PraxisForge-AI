import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Recompute the CSP from the exact export, including all route payloads.
async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? htmlFiles(join(directory, entry.name))
        : Promise.resolve(
            entry.name.endsWith(".html") ? [join(directory, entry.name)] : [],
          ),
    ),
  );
  return groups.flat();
}
const hashes = new Set();
let inlineCount = 0;
for (const file of await htmlFiles("out")) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  )) {
    if (/\bsrc\s*=/i.test(match[1]) || !match[2]) continue;
    hashes.add(
      `'sha256-${createHash("sha256").update(match[2]).digest("base64")}'`,
    );
    inlineCount++;
  }
}
if (!inlineCount)
  throw new Error(
    "Export contains no inline payloads; verify the export path.",
  );
const path = "deploy/headers.conf";
const previous = await readFile(path, "utf8");
const next = previous.replace(
  /script-src [^;]+;/,
  `script-src 'self' ${[...hashes].sort().join(" ")};`,
);
if (next === previous && !previous.includes([...hashes][0]))
  throw new Error("CSP template missing script-src.");
await writeFile(path, next);
console.log(
  `CSP prepared: ${inlineCount} inline scripts, ${hashes.size} unique hashes.`,
);
