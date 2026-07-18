/**
 * Feedback proxy: forwards POST to backend (server.js running on Hostinger VPS).
 *
 * Env var:
 *   BACKEND_API_URL — e.g. "https://api.cnccostify.cloud" (default: same-origin /api)
 *
 * Why proxy instead of writing locally?
 *   Vercel serverless filesystem is ephemeral; can't persist SQLite across cold starts.
 *   Backend on Hostinger VPS owns the database (cnc.db) — single source of truth.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const fwd = req.headers.get("x-forwarded-for") || "";
    const ip = fwd.split(",")[0].trim() || "unknown";
    const ua = req.headers.get("user-agent") || "";

    const upstream = await fetch(`${BACKEND_URL}/api/feedback/suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": ip,
        "User-Agent": ua,
      },
      body,
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[feedback proxy] failed:", err);
    return NextResponse.json(
      { ok: false, error: "backend_unreachable", message: "Backend API ไม่พร้อมใช้งาน — กรุณาลองใหม่หรือ email ตรง info@cnccostify.cloud" },
      { status: 502 }
    );
  }
}
