import crypto from "crypto";

export function makeFingerprint(message: string): string {
  const cleaned = message
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, "<id>")
    .replace(/\b[0-9a-f]{16,}\b/g, "<hex>")
    .replace(/\d+/g, "<n>")
    .replace(/\s+/g, " ")
    .trim();

  return crypto.createHash("sha1").update(cleaned).digest("hex");
}

//It makes a “same error” label. 
// It replaces ids and numbers with placeholders, 
// so “timeout after 5012ms” and “timeout after 4987ms” get the same label. 
// Later, this lets us count how many times the same error happened.