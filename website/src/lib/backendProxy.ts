/**
 * Shared proxy logic — forwards a request to the backend (VPS server.js).
 * Preserves: query string, cookies, body, headers; forwards Set-Cookie + Location.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

export async function proxyToBackend(req: NextRequest, backendPath: string): Promise<NextResponse> {
  try {
    const fwd = req.headers.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0].trim() || "unknown";
    const ua = req.headers.get("user-agent") || "";
    const cookie = req.headers.get("cookie") || "";
    const auth = req.headers.get("authorization") || "";

    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;
    const search = req.nextUrl.search || "";

    const upstreamHeaders: Record<string, string> = {
      "Content-Type": req.headers.get("content-type") || "application/json",
      "X-Forwarded-For": ip,
      "User-Agent": ua,
      Cookie: cookie,
    };
    if (auth) upstreamHeaders.Authorization = auth;

    const upstream = await fetch(`${BACKEND_URL}${backendPath}${search}`, {
      method: req.method,
      headers: upstreamHeaders,
      body,
      redirect: "manual",
    });

    const status = upstream.status;
    if (status >= 300 && status < 400) {
      const location = upstream.headers.get("location") || "/";
      const res = NextResponse.redirect(
        new URL(location, req.nextUrl.origin),
        status as 301 | 302 | 303 | 307 | 308,
      );
      const setCookies = upstream.headers.getSetCookie?.() || [];
      for (const c of setCookies) res.headers.append("set-cookie", c);
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
    console.error(`[proxy ${backendPath}] failed:`, err);
    return NextResponse.json(
      { ok: false, error: "backend_unreachable" },
      { status: 502 },
    );
  }
}
