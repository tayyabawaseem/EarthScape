import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { Collections, type Feedback } from "@/lib/models";
import { bad, ok, requireUser } from "@/lib/api";

export const runtime = "nodejs";

const schema = z.object({
  type: z.enum(["bug", "idea", "question"]),
  subject: z.string().min(3).max(200),
  body: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  let body: unknown;
  try { body = await req.json(); } catch { return bad("Invalid JSON body"); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input");
  const db = await getDb();
  const doc: Feedback = { ...parsed.data, createdBy: auth.user.name, createdAt: new Date() };
  const r = await db.collection<Feedback>(Collections.feedback).insertOne(doc);
  return ok({ feedback: { ...doc, _id: r.insertedId.toString() } }, { status: 201 });
}
