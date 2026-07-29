import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { Collections, type Dashboard } from "@/lib/models";
import { bad, ok, requireUser } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const dashboards = await db
    .collection<Dashboard>(Collections.dashboards)
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();
  return ok({ dashboards: dashboards.map((d) => ({ ...d, _id: d._id!.toString() })) });
}

const schema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().optional(),
  panels: z.array(z.object({ kind: z.string(), source: z.string(), range: z.string() })).default([]),
  shared: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await req.json(); } catch { return bad("Invalid JSON body"); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input");
  const db = await getDb();
  const now = new Date();
  const doc: Dashboard = {
    ...parsed.data,
    createdBy: auth.user.name,
    createdAt: now,
    updatedAt: now,
  };
  const r = await db.collection<Dashboard>(Collections.dashboards).insertOne(doc);
  return ok({ dashboard: { ...doc, _id: r.insertedId.toString() } }, { status: 201 });
}
