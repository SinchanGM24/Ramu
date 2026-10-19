type CookieMap = Record<string, string | undefined> | undefined;

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const sessionCookieNames = new Set([
  process.env.SESSION_COOKIE_NAME || "ramu_session",
  process.env.PLATFORM_SESSION_COOKIE_NAME || "ramu_platform_session",
  "ramu_parent_session",
]);

export function getTrustedOrigins(value = process.env.FRONTEND_ORIGIN) {
  const fallback =
    process.env.NODE_ENV === "production" ? undefined : "http://localhost:3001";
  const configured = (value || fallback || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!configured.length || configured.includes("*"))
    throw new Error(
      "FRONTEND_ORIGIN harus berisi origin HTTP(S) eksplisit dan tidak boleh wildcard.",
    );

  return configured.map((origin) => {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error("FRONTEND_ORIGIN harus berisi URL origin yang valid.");
    }
    if (
      !/^https?:$/.test(parsed.protocol) ||
      parsed.origin !== origin.replace(/\/$/, "")
    )
      throw new Error(
        "FRONTEND_ORIGIN harus berupa origin HTTP(S) tanpa path.",
      );
    return parsed.origin;
  });
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function hasSessionCookie(cookies: CookieMap) {
  return Boolean(
    cookies && [...sessionCookieNames].some((name) => Boolean(cookies[name])),
  );
}

function originFromReferer(referer: string) {
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function validateCookieMutationOrigin(input: {
  method: string;
  cookies: CookieMap;
  origin?: string | string[];
  referer?: string | string[];
  trustedOrigins: readonly string[];
}) {
  if (
    !unsafeMethods.has(input.method.toUpperCase()) ||
    !hasSessionCookie(input.cookies)
  )
    return null;

  const origin = firstHeader(input.origin);
  const referer = firstHeader(input.referer);
  const sourceOrigin = origin || (referer ? originFromReferer(referer) : null);
  if (!sourceOrigin || !input.trustedOrigins.includes(sourceOrigin))
    return "Permintaan ini ditolak karena berasal dari sumber yang tidak tepercaya.";
  return null;
}
