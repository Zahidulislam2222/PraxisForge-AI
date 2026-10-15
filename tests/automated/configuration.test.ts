import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function sourceFiles(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory()
      ? sourceFiles(join(path, item.name))
      : /\.(tsx?|mjs)$/.test(item.name)
        ? [join(path, item.name)]
        : [],
  );
}

describe("frontend configuration boundary", () => {
  it("has no private keys or secret-shaped literals in source", () => {
    for (const file of sourceFiles("src")) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(
        /sk-(?:or|proj)-[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
      );
      expect(source, file).not.toMatch(
        /(?:OPENROUTER_API_KEY|CLOUDFLARE_API_TOKEN|root password)/i,
      );
    }
  });
  it("keeps environment access in typed settings and documents public variables", () => {
    for (const file of sourceFiles("src").filter(
      (file) => !file.endsWith("lib/content.ts"),
    ))
      expect(readFileSync(file, "utf8"), file).not.toContain("process.env");
    expect(readFileSync(".env.example", "utf8")).toContain(
      "NEXT_PUBLIC_SITE_URL",
    );
  });
  it("keeps provider URLs and model IDs out of browser components", () => {
    for (const file of sourceFiles("src/components"))
      expect(readFileSync(file, "utf8"), file).not.toMatch(
        /https?:\/\/|bytedance\/|seedance-/i,
      );
  });
});
