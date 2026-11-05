import crypto from "crypto";

export function generateApiKey() {
  const raw = "tp_live_" + crypto.randomBytes(24).toString("hex");
  return {
    raw,
    keyHash: hashApiKey(raw),
    keyPrefix: raw.slice(0, 12),
  };
}

export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}