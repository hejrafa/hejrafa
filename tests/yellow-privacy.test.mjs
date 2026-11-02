// Yellow's finance, health, and letter content must only ever reach git as ciphertext.
// This checks the committed (index) Yellow files, the ciphertext envelope, the entry-point
// copies, and that the Node crypto round-trips with the right password and fails with a wrong one.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FORMAT, decryptPayload, encryptPayload } from "../scripts/yellow-crypto.mjs";
import { ENTRY_FOLDERS, entryPointsMatchShell } from "../scripts/yellow-sync.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(resolve(ROOT, file), "utf8");

// Staged + tracked files are what a commit ships; the working tree may hold yellow/private/.
function committedYellowFiles() {
  const output = execFileSync("git", ["ls-files", "-z", "--cached", "--", "yellow", "scripts", "tests"], { cwd: ROOT, encoding: "utf8" });
  return output.split("\0").filter(Boolean);
}

// Euro amounts as the finance rows print them: 2.055,60€ / 9,99 € / 12,00€
const AMOUNT_RE = /\d{1,3}(?:\.\d{3})*,\d{2}\s?€/;
// Health and letter copy that exists only in the private panels and data (not selectors:
// the stylesheet and script may name classes and attributes, never content).
const PRIVATE_MARKERS = [
  "Biomarkers", "Hemoglobin", "Ferritin", "Cookbook p.", "Big Bison", "Xar Salad", "Beef Broc", "rice bowl",
  "Dear future favorite person", "we don't need roads",
];
// The private panels themselves, which only the decrypted payload may contain.
const PANEL_MARKERS = ['data-yellow-page="health"', 'data-yellow-page="finance"', 'data-yellow-page="letter"', "<table"];

test("yellow/private/ is ignored by git and nothing from it is committed", () => {
  assert.match(read(".gitignore"), /^yellow\/private\/$/m);
  const leaked = committedYellowFiles().filter((file) => file.startsWith("yellow/private/"));
  assert.deepEqual(leaked, []);
});

test("committed Yellow HTML and JS carry no finance amounts, health copy, or letter text", () => {
  const files = committedYellowFiles().filter((file) => file.startsWith("yellow/") && [".html", ".js", ".mjs", ".css"].includes(extname(file)));
  assert.ok(files.length >= 10, `expected the Yellow pages and scripts, got ${files.length}`);
  const findings = [];
  for (const file of files) {
    const text = read(file);
    if (AMOUNT_RE.test(text)) findings.push(`${file}: euro amount ${text.match(AMOUNT_RE)[0]}`);
    for (const marker of PRIVATE_MARKERS) {
      if (text.includes(marker)) findings.push(`${file}: "${marker}"`);
    }
    if (extname(file) === ".html") {
      for (const marker of PANEL_MARKERS) {
        if (text.includes(marker)) findings.push(`${file}: "${marker}"`);
      }
    }
  }
  assert.deepEqual(findings, [], `private content in committed files:\n  ${findings.join("\n  ")}`);
});

test("the shell keeps the gate and Rewind, mounts the private panels, and has no plaintext password", () => {
  const shell = read("yellow/index.html");
  assert.match(shell, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(shell, /data-yellow-gate/);
  assert.match(shell, /data-yellow-stage/);
  assert.match(shell, /data-rewind-root/);
  assert.equal((shell.match(/data-yellow-page=/g) || []).length, 1, "only the Rewind panel ships in the shell");

  const js = read("yellow/assets/js/yellow.js");
  assert.match(js, /crypto\.subtle\.deriveKey/, "unlock derives a key with WebCrypto");
  assert.match(js, /"\/yellow\/assets\/data\/yellow\.enc"/, "unlock fetches the ciphertext");
  assert.doesNotMatch(js, /(?:password|entered)[^\n]*===\s*"/i, "no plaintext password comparison");
  assert.doesNotMatch(js, /localStorage\.setItem\([^)]*unlock/i, "unlock state never goes to localStorage");
});

test("every Yellow entry point is a byte-identical copy of the shell", () => {
  for (const folder of ENTRY_FOLDERS) assert.ok(existsSync(resolve(ROOT, "yellow", folder, "index.html")), `${folder}/index.html exists`);
  assert.deepEqual(entryPointsMatchShell(ROOT), [], "run `npm run yellow:sync`");
});

test("yellow.enc is a well-formed envelope with a strong KDF", () => {
  const envelope = JSON.parse(read("yellow/assets/data/yellow.enc"));
  assert.equal(envelope.format, FORMAT);
  assert.equal(envelope.kdf.name, "PBKDF2");
  assert.equal(envelope.kdf.hash, "SHA-256");
  assert.ok(envelope.kdf.iterations >= 300_000, `iterations ${envelope.kdf.iterations}`);
  assert.equal(Buffer.from(envelope.kdf.salt, "base64").length, 16, "16-byte salt");
  assert.equal(envelope.cipher.name, "AES-GCM");
  assert.equal(envelope.cipher.length, 256);
  assert.equal(Buffer.from(envelope.cipher.iv, "base64").length, 12, "12-byte IV");
  assert.ok(Buffer.from(envelope.ciphertext, "base64").length > 1024, "ciphertext present");
  assert.doesNotMatch(read("yellow/assets/data/yellow.enc"), /<section|€/);
});

test("the crypto round-trips with the right password and rejects a wrong one", async () => {
  const payload = { version: 1, panels: "<section>12,34€</section>", data: { healthWeeks: [{ id: "week1" }] } };
  const envelope = await encryptPayload(payload, "  Correct Horse ", { iterations: 100_000 });
  assert.equal(envelope.format, FORMAT);
  assert.doesNotMatch(JSON.stringify(envelope), /12,34|week1/);
  assert.deepEqual(await decryptPayload(envelope, "correct horse"), payload, "NFKC + trim + lowercase normalisation");
  await assert.rejects(() => decryptPayload(envelope, "correct horse!"), /Wrong password/);
  await assert.rejects(() => decryptPayload({ ...envelope, format: "other" }, "correct horse"), /Unknown payload format/);
});
