import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { Collections, type Ticket } from "@/lib/models";
import { bad, ok, requireUser, requireAdmin } from "@/lib/api";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const mine = req.nextUrl.searchParams.get("mine") === "true";
  const db = await getDb();
  const filter = mine ? { createdBy: auth.user.name } : {};
  const tickets = await db
    .collection<Ticket>(Collections.tickets)
    .find(filter)
    .sort({ updatedAt: -1 })
    .toArray();
  const openCount = await db
    .collection<Ticket>(Collections.tickets)
    .countDocuments({ ...filter, status: { $in: ["open", "in-progress"] } });
  return ok({
    tickets: tickets.map((t) => ({ ...t, _id: t._id!.toString() })),
    openCount,
    scope: mine ? "mine" : "all",
  });
}

const createSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().optional(),
  category: z.string().default("General"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await req.json(); } catch { return bad("Invalid JSON body"); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input");

  const db = await getDb();
  const yr = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  const now = new Date();
  const doc: Ticket = {
    ticketId: `ER-${yr}-${seq}`,
    subject: parsed.data.subject,
    body: parsed.data.body,
    category: parsed.data.category,
    priority: parsed.data.priority,
    status: "open",
    createdBy: auth.user.name,
    createdAt: now,
    updatedAt: now,
  };
  const r = await db.collection<Ticket>(Collections.tickets).insertOne(doc);
  await recordAudit({
    actor: auth.user,
    action: `opened ticket ${doc.ticketId}`,
    target: doc.subject,
  });
  return ok({ ticket: { ...doc, _id: r.insertedId.toString() } }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["open", "in-progress", "resolved"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await req.json(); } catch { return bad("Invalid JSON body"); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return bad("Invalid input");
  const { id, ...changes } = parsed.data;
  if (Object.keys(changes).length === 0) return bad("No changes provided");
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return bad("Invalid id"); }

  const db = await getDb();
  const updated = await db.collection<Ticket>(Collections.tickets).findOneAndUpdate(
    { _id: oid },
    { $set: { ...changes, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!updated) return bad("Ticket not found", 404);
  await recordAudit({
    actor: auth.user,
    action: `updated ${updated.ticketId} → ${Object.entries(changes).map(([k, v]) => `${k}=${v}`).join(", ")}`,
    target: updated.subject,
  });
  return ok({ ticket: { ...updated, _id: updated._id!.toString() } });
}
