import crypto from "node:crypto";

export function verifyHmacSha256Hex(secret: string, rawBody: string, header: string | null): boolean {
  if (!header) return false;
  const expectedPrefix = "sha256=";
  if (!header.startsWith(expectedPrefix)) return false;
  const received = header.slice(expectedPrefix.length);
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}
