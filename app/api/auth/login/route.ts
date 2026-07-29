import { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import { Collections, type User } from "@/lib/models";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";
import { bad, ok } from "@/lib/api";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return bad("Email and password are required");

  const { email, password } = parsed.data;
  const db = await getDb();
  const users = db.collection<User>(Collections.users);
  const user = await users.findOne({ email });
  if (!user) return bad("Invalid email or password", 401);

  const ok_ = await verifyPassword(password, user.passwordHash);
  if (!ok_) return bad("Invalid email or password", 401);

  await users.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } });

  const token = await signSession({
    uid: user._id!.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  return ok({
    user: { id: user._id!.toString(), email: user.email, name: user.name, role: user.role },
  });
}
