import dns from "node:dns/promises";
import net from "node:net";

const B0 = BigInt(0);
const B8 = BigInt(8);

function parseV4(ip: string): bigint | null {
  if (!net.isIPv4(ip)) return null;
  return ip.split(".").reduce((a, b) => (a << B8) + BigInt(b), B0);
}

function isBlockedV4(ip: string): boolean {
  if (ip === "127.0.0.1") return true;
  const n = parseV4(ip);
  if (n === null) return false;
  const b = (s: string) => parseV4(s)!;
  if (n >= b("10.0.0.0") && n <= b("10.255.255.255")) return true;
  if (n >= b("172.16.0.0") && n <= b("172.31.255.255")) return true;
  if (n >= b("192.168.0.0") && n <= b("192.168.255.255")) return true;
  if (n >= b("127.0.0.0") && n <= b("127.255.255.255")) return true;
  if (n >= b("0.0.0.0") && n <= b("0.255.255.255")) return true;
  return false;
}

/** IPv6 blocklist: loopback, link-local, ULA (/7); ::ffff:x.x.x.x defers to v4 rules. */
function isBlockedV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fe80:")) return true;
  const head = lower.split(":")[0] ?? "";
  if (/^f[cd][0-9a-f]{2}$/i.test(head)) return true;
  if (lower.startsWith("::ffff:")) {
    const tail = lower.slice(7);
    if (net.isIPv4(tail)) return isBlockedV4(tail);
  }
  return false;
}

function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isBlockedV4(ip);
  if (net.isIPv6(ip)) return isBlockedV6(ip);
  return true;
}

/** Fetch public HTTPS URL with basic SSRF protection (hostname resolve + size cap). */
export async function fetchUrlSafe(urlStr: string, maxBytes = 500_000) {
  const u = new URL(urlStr);
  if (u.protocol !== "https:") {
    throw new Error("only_https");
  }
  const lookups = await dns.lookup(u.hostname, { all: true, verbatim: true });
  for (const entry of lookups) {
    if (isBlockedIp(entry.address)) {
      throw new Error("blocked_address");
    }
  }
  const res = await fetch(urlStr, {
    redirect: "manual",
    headers: { "User-Agent": "SMM-ResearchBot/1.0" },
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  const buf = await res.arrayBuffer();
  if (buf.byteLength > maxBytes) throw new Error("too_large");
  const text = new TextDecoder().decode(buf);
  return { contentType: res.headers.get("content-type"), text: text.slice(0, maxBytes) };
}
