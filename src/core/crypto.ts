import crypto from "crypto";
import os from "os";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT = "prompt-engineer-2026-v1"; // not secret — just domain separation
const KEY_LENGTH = 32;
const ITERATIONS = 100_000;

/**
 * Derive an encryption key from machine-specific entropy.
 * No user passphrase needed — the key is tied to this machine.
 */
function getEncryptionKey(): crypto.CipherKey {
  // Machine-specific entropy: hostname + username + home dir
  const entropy = [
    os.hostname(),
    os.userInfo().username,
    os.homedir(),
    "prompt-engineer-api-key-encryption",
  ].join("::");

  return crypto.pbkdf2Sync(entropy, SALT, ITERATIONS, KEY_LENGTH, "sha512");
}

/**
 * Encrypt a plaintext string. Returns "enc:" + base64(iv + authTag + ciphertext).
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Pack: iv (16) + authTag (16) + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return "enc:" + packed.toString("base64");
}

/**
 * Decrypt a string produced by encrypt(). Returns plaintext.
 * If the input doesn't start with "enc:", it's treated as legacy plaintext.
 */
export function decrypt(encryptedValue: string): string {
  if (!encryptedValue) return "";
  if (!encryptedValue.startsWith("enc:")) return encryptedValue; // legacy plaintext

  const key = getEncryptionKey();
  const packed = Buffer.from(encryptedValue.slice(4), "base64");

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = packed.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Check if a value is encrypted (starts with "enc:").
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith("enc:");
}
