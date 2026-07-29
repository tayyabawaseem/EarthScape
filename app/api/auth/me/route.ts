import { getSession } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  return ok({
    user: {
      id: session.uid,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
}
