/**
 * Auth proxy: forwards /api/auth/* to backend (Hostinger VPS server.js).
 *
 * Forwards Set-Cookie from backend to browser so JWT session cookie persists.
 * Forwards Location header for OAuth redirect flows (Google).
 *
 * Env: BACKEND_API_URL — default http://localhost:5000
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await ctx.params;
    const fwd = req.headers.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0].trim() || "unknown";
    const ua = req.headers.get("user-agent") || "";
    const cookie = req.headers.get("cookie") || "";

    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

    // Preserve query string for OAuth callbacks (?code=...&state=...)
    const search = req.nextUrl.search || "";
    const upstreamUrl = `${BACKEND_URL}/api/auth/${path.join("/")}${search}`;

    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/json",
        "X-Forwarded-For": ip,
        "User-Agent": ua,
        Cookie: cookie,
      },
      body,
      redirect: "manual",
    });

    // OAuth redirect flow: forward 3xx with Location + Set-Cookie
    const status = upstream.status;
    if (status >= 300 && status < 400) {
      const location = upstream.headers.get("location") || "/";
      const res = NextResponse.redirect(new URL(location, req.nextUrl.origin), status as 301 | 302 | 303 | 307 | 308);
      const setCookies = upstream.headers.getSetCookie?.() || [];
      for (const c of setCookies) res.headers.append("set-cookie", c);
      // Fallback for runtimes without getSetCookie
      if (setCookies.length === 0) {
        const sc = upstream.headers.get("set-cookie");
        if (sc) res.headers.set("set-cookie", sc);
      }
      return res;
    }

    const data = await upstream.text();
    const res = new NextResponse(data, {
      status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
    });
    const setCookies = upstream.headers.getSetCookie?.() || [];
    for (const c of setCookies) res.headers.append("set-cookie", c);
    if (setCookies.length === 0) {
      const sc = upstream.headers.get("set-cookie");
      if (sc) res.headers.set("set-cookie", sc);
    }
    return res;
  } catch (err) {
    console.error("[auth proxy] failed:", err);
    return NextResponse.json(
      { ok: false, error: "backend_unreachable" },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
