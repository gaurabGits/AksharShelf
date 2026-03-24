function base64UrlDecode(input) {
  const str = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = str + "===".slice((str.length + 3) % 4);
  if (typeof atob === "function") return atob(padded);
  // Node/SSR fallback
  if (typeof Buffer !== "undefined") {
    // eslint-disable-next-line no-undef
    return Buffer.from(padded, "base64").toString("binary");
  }
  throw new Error("No base64 decoder available");
}

export function getJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isJwtExpired(token, skewSeconds = 30) {
  const payload = getJwtPayload(token);
  if (!payload) return true;
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return true;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + Math.max(0, Number(skewSeconds) || 0);
}
