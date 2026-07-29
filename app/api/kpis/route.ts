import { getDb } from "@/lib/mongodb";
import { Collections } from "@/lib/models";
import { ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const [openTickets, totalUsers, totalDashboards] = await Promise.all([
    db.collection(Collections.tickets).countDocuments({ status: { $in: ["open", "in-progress"] } }),
    db.collection(Collections.users).countDocuments({}),
    db.collection(Collections.dashboards).countDocuments({}),
  ]);

  return ok({ openTickets, totalUsers, totalDashboards });
}
