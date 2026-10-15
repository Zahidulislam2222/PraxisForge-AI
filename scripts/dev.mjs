import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const config = JSON.parse(
  readFileSync(new URL("../config/frontend.json", import.meta.url), "utf8"),
);
const cli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const child = spawn(
  process.execPath,
  [
    cli,
    "dev",
    "--webpack",
    "--hostname",
    config.preview.host,
    "--port",
    String(config.preview.port),
  ],
  { stdio: "inherit", env: process.env },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
