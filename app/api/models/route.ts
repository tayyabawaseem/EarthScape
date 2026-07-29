import { getDb } from "@/lib/mongodb";
import { Collections, type ModelRecord } from "@/lib/models";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const models = await db
    .collection<ModelRecord>(Collections.models)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  const summary = {
    active: models.filter((m) => m.status === "live").length,
    training: models.filter((m) => m.status === "training").length,
    avgAccuracy: models.length ? +(models.reduce((s, m) => s + m.accuracy, 0) / models.length).toFixed(3) : 0,
    runs: models.reduce((s, m) => s + m.runs, 0),
  };
  return ok({
    models: models.map((m) => ({ ...m, _id: m._id!.toString() })),
    summary,
  });
}
