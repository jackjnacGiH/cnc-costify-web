/**
 * Auth proxy: forwards /api/auth/* to backend (Hostinger VPS server.js).
 *
 * Forwards Set-Cookie from backend to browser so JWT session cookie persists.
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

    const upstream = await fetch(`${BACKEND_URL}/api/auth/${path.join("/")}`, {
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

    const data = await upstream.text();
    const res = new NextResponse(data, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
    });
    // Forward Set-Cookie from backend to browser
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);
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
