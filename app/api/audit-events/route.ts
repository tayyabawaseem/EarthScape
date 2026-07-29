import { NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Collections, type AuditEvent } from "@/lib/models";
import { ok, requireUser } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "20", 10) || 20, 100);
  const db = await getDb();
  const events = await db
    .collection<AuditEvent>(Collections.auditEvents)
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return ok({ events: events.map((e) => ({ ...e, _id: e._id!.toString() })) });
}
