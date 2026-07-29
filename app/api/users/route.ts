import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { Collections, type User } from "@/lib/models";
import { bad, ok, requireAdmin } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = await getDb();
  const users = await db
    .collection<User>(Collections.users)
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
  const counts = {
    admin: await db.collection(Collections.users).countDocuments({ role: "admin" }),
    analyst: await db.collection(Collections.users).countDocuments({ role: "analyst" }),
  };
  return ok({ users: users.map((u) => ({ ...u, _id: u._id!.toString() })), counts });
}

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "analyst"]).default("analyst"),
});

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await req.json(); } catch { return bad("Invalid JSON body"); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input");

  const db = await getDb();
  const exists = await db.collection<User>(Collections.users).findOne({ email: parsed.data.email });
  if (exists) return bad("A user with that email already exists", 409);

  if (parsed.data.role === "admin") {
    const adminCount = await db.collection<User>(Collections.users).countDocuments({ role: "admin" });
    if (adminCount >= 1) return bad("Only one administrator is allowed", 409);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const doc: User = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    passwordHash,
    createdAt: new Date(),
  };
  const r = await db.collection<User>(Collections.users).insertOne(doc);
  const { passwordHash: _ph, ...safe } = doc;
  void _ph;
  await recordAudit({
    actor: auth.user,
    action: `created ${parsed.data.name} as ${parsed.data.role}`,
    target: parsed.data.email,
  });
  return ok({ user: { ...safe, _id: r.insertedId.toString() } }, { status: 201 });
}

const patchSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["admin", "analyst"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await req.json(); } catch { return bad("Invalid JSON body"); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return bad("Invalid input");
  let oid: ObjectId;
  try { oid = new ObjectId(parsed.data.id); } catch { return bad("Invalid id"); }
  const { id, ...patch } = parsed.data;
  void id;

  const db = await getDb();

  // Enforce single-admin policy
  if (patch.role) {
    const target = await db.collection<User>(Collections.users).findOne({ _id: oid });
    if (!target) return bad("User not found", 404);
    if (patch.role === "admin" && target.role !== "admin") {
      const adminCount = await db.collection<User>(Collections.users).countDocuments({ role: "admin" });
      if (adminCount >= 1) return bad("Only one administrator is allowed", 409);
    }
    if (patch.role === "analyst" && target.role === "admin") {
      const adminCount = await db.collection<User>(Collections.users).countDocuments({ role: "admin" });
      if (adminCount <= 1) return bad("Cannot demote the only administrator", 409);
    }
  }

  const updated = await db.collection<User>(Collections.users).findOneAndUpdate(
    { _id: oid },
    { $set: patch },
    { returnDocument: "after", projection: { passwordHash: 0 } }
  );
  if (!updated) return bad("User not found", 404);
  const changes = Object.entries(patch).map(([k, v]) => `${k}=${String(v)}`).join(", ");
  await recordAudit({
    actor: auth.user,
    action: `updated user ${updated.name} (${changes})`,
    target: updated.email,
  });
  return ok({ user: { ...updated, _id: updated._id!.toString() } });
}
