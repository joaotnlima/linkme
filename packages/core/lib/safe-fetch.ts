import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF guard: refuses URLs that resolve to loopback, private, link-local, multicast or
 * otherwise non-public addresses. Called on every hop of a redirect chain.
 */
function isPrivateV4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    a >= 224 // multicast / reserved
  );
}
function isPrivateV6(ip: string) {
  const v = ip.toLowerCase();
  if (v === "::1" || v === "::") return true;
  if (v.startsWith("fe80:") || v.startsWith("fc") || v.startsWith("fd")) return true;
  if (v.startsWith("::ffff:")) return isPrivateV4(v.slice(7));
  return false;
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Only http(s) URLs are fetched");
  if (u.username || u.password) throw new Error("Credentials in URLs are not allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Internal host");
  const ipv = isIP(host);
  const addrs = ipv ? [{ address: host, family: ipv }] : await lookup(host, { all: true });
  if (!addrs.length) throw new Error("Unresolvable host");
  for (const a of addrs) {
    if ((a.family === 4 && isPrivateV4(a.address)) || (a.family === 6 && isPrivateV6(a.address))) throw new Error("Non-public address");
  }
  return u;
}

/** fetch with the guard applied to the URL and to every redirect hop (max 3). */
export async function safeFetch(raw: string, init: RequestInit & { maxRedirects?: number } = {}): Promise<Response> {
  const { maxRedirects = 3, ...rest } = init;
  let url = (await assertPublicUrl(raw)).toString();
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const res = await fetch(url, { ...rest, redirect: "manual" });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc || hop === maxRedirects) throw new Error("Too many redirects");
      url = (await assertPublicUrl(new URL(loc, url).toString())).toString();
      continue;
    }
    return res;
  }
  throw new Error("Redirect loop");
}
