import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { Collections, type User } from "@/lib/models";
import { bad, ok, requireUser } from "@/lib/api";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const db = await getDb();
  let oid: ObjectId;
  try { oid = new ObjectId(auth.user.uid); } catch { return bad("Invalid session"); }
  const user = await db
    .collection<User>(Collections.users)
    .findOne({ _id: oid }, { projection: { passwordHash: 0 } });
  if (!user) return bad("User not found", 404);
  return ok({ user: { ...user, _id: user._id!.toString() } });
}

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().toLowerCase().optional(),
  timezone: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await req.json(); } catch { return bad("Invalid JSON body"); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return bad("Invalid input");
  let oid: ObjectId;
  try { oid = new ObjectId(auth.user.uid); } catch { return bad("Invalid session"); }

  const db = await getDb();
  const updated = await db.collection<User>(Collections.users).findOneAndUpdate(
    { _id: oid },
    { $set: parsed.data },
    { returnDocument: "after", projection: { passwordHash: 0 } }
  );
  if (!updated) return bad("Not found", 404);
  await recordAudit({ actor: auth.user, action: "updated profile" });
  return ok({ user: { ...updated, _id: updated._id!.toString() } });
}
