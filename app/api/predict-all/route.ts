import { NextRequest } from "next/server";
import { ok, bad } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ML = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  const horizon = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("horizon") || "1", 10) || 1, 1), 7);
  try {
    const res = await fetch(`${ML}/predict-all?horizon=${horizon}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${text.slice(0, 120)}`);
    }
    const json = await res.json();
    return ok({ ok: true, ...json });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Model service unreachable";
    return bad(
      `Model service unreachable at ${ML}. Did you start it? (cd ml && python server.py). Details: ${msg}`,
      503,
    );
  } finally {
    clearTimeout(timer);
  }
}
