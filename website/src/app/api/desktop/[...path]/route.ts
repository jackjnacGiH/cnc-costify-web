import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backendProxy";

export const runtime = "nodejs";

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxyToBackend(req, `/api/desktop/${path.join("/")}`);
}

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
