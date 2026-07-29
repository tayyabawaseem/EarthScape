import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { Collections, type User } from "@/lib/models";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { bad, ok } from "@/lib/api";

export const runtime = "nodejs";

// Self-registration only creates analysts. Admins must be invited by an
// existing admin from the Users page.
const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input");

  const { name, email, password } = parsed.data;
  const role = "analyst" as const;
  const db = await getDb();
  const users = db.collection<User>(Collections.users);

  const existing = await users.findOne({ email });
  if (existing) return bad("An account with that email already exists", 409);

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const result = await users.insertOne({
    email,
    name,
    passwordHash,
    role,
    timezone: "UTC",
    lastActiveAt: now,
    createdAt: now,
  });

  const token = await signSession({
    uid: result.insertedId.toString(),
    email,
    name,
    role,
  });
  await setSessionCookie(token);

  return ok({ user: { id: result.insertedId.toString(), email, name, role } }, { status: 201 });
}
