import crypto from "crypto";

const ALGO = "aes-256-cbc";

function getKey(): Buffer {
  const secret = process.env.PASSWORD_ENCRYPTION_KEY || process.env.SECRET_KEY || "sisolo-dev-key-2024!!change!";
  return Buffer.from(secret.padEnd(32).slice(0, 32));
}

export function encryptPassword(password: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptPassword(encrypted: string): string {
  const key = getKey();
  const parts = encrypted.split(":");
  const iv = Buffer.from(parts.shift()!, "hex");
  const data = parts.join(":");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
