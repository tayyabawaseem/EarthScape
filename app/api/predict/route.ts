import { NextRequest } from "next/server";
import { ok, bad } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ML = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(`${ML}${path}`, { signal, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${path} -> HTTP ${res.status} ${text.slice(0, 120)}`);
  }
  return (await res.json()) as T;
}

export async function GET(req: NextRequest) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  const city = req.nextUrl.searchParams.get("city") || undefined;
  const horizon = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get("horizon") || "7", 10) || 7, 1), 30);
  try {
    const info = await getJson<unknown>("/info", controller.signal);
    const cities = await getJson<unknown>("/cities", controller.signal);
    if (!city) {
      return ok({ ok: true, info, cities });
    }
    const [history, backtest, forecast] = await Promise.all([
      getJson<unknown>(`/history?city=${encodeURIComponent(city)}&days=180`, controller.signal),
      getJson<unknown>(`/backtest?city=${encodeURIComponent(city)}`, controller.signal),
      getJson<unknown>(`/predict?city=${encodeURIComponent(city)}&horizon=${horizon}`, controller.signal),
    ]);
    return ok({ ok: true, info, cities, history, backtest, forecast });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Model service unreachable";
    return bad(
      `Model service unreachable at ${ML}. Did you start it? (cd ml && python server.py). Details: ${msg}`,
      503
    );
  } finally {
    clearTimeout(timer);
  }
}
