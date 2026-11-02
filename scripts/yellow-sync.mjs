// Yellow's router uses real paths (/yellow/finance/ etc.), so every sub-folder needs
// the same static entry point. This copies yellow/index.html (the shell) into each one.
// Run directly (`npm run yellow:sync`) or via scripts/yellow-encrypt.mjs.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SHELL = "yellow/index.html";
export const ENTRY_FOLDERS = ["health", "finance", "finance-yearly", "finance-debt", "letter"];

export function syncEntryPoints(root = ROOT) {
  const shell = join(root, SHELL);
  const written = [];
  for (const folder of ENTRY_FOLDERS) {
    const target = join(root, "yellow", folder, "index.html");
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(shell, target);
    written.push(target);
  }
  return written;
}

export function entryPointsMatchShell(root = ROOT) {
  const shell = readFileSync(join(root, SHELL), "utf8");
  return ENTRY_FOLDERS.filter((folder) => readFileSync(join(root, "yellow", folder, "index.html"), "utf8") !== shell);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const written = syncEntryPoints();
  console.log(`Copied ${SHELL} to ${written.length} entry points: ${ENTRY_FOLDERS.join(", ")}.`);
}
