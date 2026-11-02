// Shared crypto for the Yellow payload. Node side only (WebCrypto + zlib); the
// browser mirror lives in yellow/assets/js/yellow.js and must stay in sync with
// FORMAT and the envelope shape below.
//
// Envelope (yellow/assets/data/yellow.enc, plain JSON):
//   { format, kdf: { name, hash, iterations, salt }, cipher: { name, length, iv },
//     compression, ciphertext }
// salt, iv and ciphertext are base64. The plaintext is JSON, gzipped before encryption.
import { gunzipSync, gzipSync } from "node:zlib";

export const FORMAT = "hejrafa-yellow/1";
export const DEFAULT_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const subtle = globalThis.crypto.subtle;

/** Same normalisation as the browser: Unicode NFKC, trimmed, lower-cased. */
export function normalizePassword(password) {
  return String(password ?? "").normalize("NFKC").trim().toLowerCase();
}

async function deriveKey(password, salt, iterations, hash, usages) {
  const material = await subtle.importKey("raw", new TextEncoder().encode(normalizePassword(password)), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", hash, salt, iterations }, material, { name: "AES-GCM", length: 256 }, false, usages);
}

export async function encryptPayload(payload, password, { iterations = DEFAULT_ITERATIONS } = {}) {
  if (!normalizePassword(password)) throw new Error("A password is required.");
  if (!Number.isInteger(iterations) || iterations < 100_000) throw new Error("Use at least 100000 PBKDF2 iterations.");
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, iterations, "SHA-256", ["encrypt"]);
  const plaintext = gzipSync(Buffer.from(JSON.stringify(payload), "utf8"), { level: 9 });
  const ciphertext = await subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    format: FORMAT,
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations, salt: Buffer.from(salt).toString("base64") },
    cipher: { name: "AES-GCM", length: 256, iv: Buffer.from(iv).toString("base64") },
    compression: "gzip",
    ciphertext: Buffer.from(ciphertext).toString("base64"),
  };
}

export async function decryptPayload(envelope, password) {
  if (envelope?.format !== FORMAT) throw new Error(`Unknown payload format: ${envelope?.format}`);
  const salt = Buffer.from(envelope.kdf.salt, "base64");
  const iv = Buffer.from(envelope.cipher.iv, "base64");
  const key = await deriveKey(password, salt, envelope.kdf.iterations, envelope.kdf.hash, ["decrypt"]);
  let plaintext;
  try {
    plaintext = Buffer.from(await subtle.decrypt({ name: "AES-GCM", iv }, key, Buffer.from(envelope.ciphertext, "base64")));
  } catch {
    throw new Error("Wrong password (decryption failed).");
  }
  if (envelope.compression === "gzip") plaintext = gunzipSync(plaintext);
  return JSON.parse(plaintext.toString("utf8"));
}
