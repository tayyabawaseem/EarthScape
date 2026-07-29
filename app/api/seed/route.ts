import { getDb } from "@/lib/mongodb";
import {
  Collections,
  type User,
  type Ticket,
  type Dashboard,
  type ModelRecord,
  type AuditEvent,
} from "@/lib/models";
import { hashPassword } from "@/lib/auth";
import { ok, bad } from "@/lib/api";

export const runtime = "nodejs";

function daysAgo(d: number) {
  return new Date(Date.now() - d * 24 * 3600 * 1000);
}
function minsAgo(m: number) {
  return new Date(Date.now() - m * 60 * 1000);
}

export async function POST() {
  try {
    const db = await getDb();
    const reset = true;
    if (reset) {
      await Promise.all(
        Object.values(Collections).map((c) => db.collection(c).deleteMany({}))
      );
    }

    const passwordHash = await hashPassword("Climate2026!");

    // Exactly one admin; the rest are analysts.
    const users: User[] = [
      { email: "admin@earthscape.io", name: "Mateus Silva", passwordHash, role: "admin", lastActiveAt: minsAgo(8), createdAt: daysAgo(120), timezone: "UTC+5", region: "Lahore" },
      { email: "analyst@earthscape.io", name: "Aria Chen", passwordHash, role: "analyst", lastActiveAt: minsAgo(2), createdAt: daysAgo(90), timezone: "UTC+5", region: "Karachi" },
      { email: "y.tanaka@earthscape.io", name: "Yuki Tanaka", passwordHash, role: "analyst", lastActiveAt: minsAgo(60), createdAt: daysAgo(60), timezone: "UTC+5", region: "Islamabad" },
      { email: "l.akhmadi@earthscape.io", name: "Lina Akhmadi", passwordHash, role: "analyst", lastActiveAt: minsAgo(180), createdAt: daysAgo(45), timezone: "UTC+5", region: "Quetta" },
      { email: "p.kohli@earthscape.io", name: "Priya Kohli", passwordHash, role: "analyst", lastActiveAt: daysAgo(2), createdAt: daysAgo(20), timezone: "UTC+5", region: "Multan" },
      { email: "n.cole@earthscape.io", name: "Noah Cole", passwordHash, role: "analyst", lastActiveAt: daysAgo(12), createdAt: daysAgo(150), timezone: "UTC+5", region: "Hyderabad" },
    ];
    await db.collection<User>(Collections.users).insertMany(users);

    const tickets: Ticket[] = [
      { ticketId: "ER-2841", subject: "Lahore forecast looks 2 °C cold vs. PMD bulletin", category: "Models", priority: "high", status: "open", createdBy: "Aria Chen", createdAt: minsAgo(12), updatedAt: minsAgo(12) },
      { ticketId: "ER-2840", subject: "Add Multan to the city dropdown shortcuts", category: "Visualizations", priority: "medium", status: "in-progress", createdBy: "Yuki Tanaka", createdAt: minsAgo(60), updatedAt: minsAgo(30) },
      { ticketId: "ER-2839", subject: "Backtest chart cropping on mobile", category: "Visualizations", priority: "low", status: "in-progress", createdBy: "Lina Akhmadi", createdAt: minsAgo(180), updatedAt: minsAgo(120) },
      { ticketId: "ER-2838", subject: "Add humidity to the forecast output", category: "Models", priority: "low", status: "resolved", createdBy: "Aria Chen", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
      { ticketId: "ER-2837", subject: "Karachi station last-updated date is stale", category: "Models", priority: "medium", status: "open", createdBy: "Priya Kohli", createdAt: daysAgo(2), updatedAt: daysAgo(2) },
    ];
    await db.collection<Ticket>(Collections.tickets).insertMany(tickets);

    const dashboards: Dashboard[] = [
      { name: "Karachi heat tracker", description: "Daily tmax and tmin trend, 30-day rolling", panels: [{ kind: "line", source: "temp", range: "30d" }], shared: true, createdBy: "Aria Chen", createdAt: daysAgo(7), updatedAt: minsAgo(120) },
      { name: "Northern winter outlook", description: "Murree, Gilgit, Skardu, Muzaffarabad daily mins", panels: [{ kind: "line", source: "tmin", range: "60d" }], shared: true, createdBy: "Yuki Tanaka", createdAt: daysAgo(10), updatedAt: daysAgo(1) },
      { name: "Punjab plains weekly", description: "Lahore, Faisalabad, Multan, Bahawalpur mean temps", panels: [{ kind: "line", source: "temp", range: "7d" }], shared: true, createdBy: "Mateus Silva", createdAt: daysAgo(14), updatedAt: daysAgo(3) },
    ];
    await db.collection<Dashboard>(Collections.dashboards).insertMany(dashboards);

    const models: ModelRecord[] = [
      {
        name: "TempForecast-XGB",
        algorithm: "XGBoost",
        task: "Next-day mean temperature for Pakistani cities",
        accuracy: 0.96,
        status: "live",
        runs: 0,
        lastTrainedAt: daysAgo(1),
        createdAt: daysAgo(5),
      },
    ];
    await db.collection<ModelRecord>(Collections.models).insertMany(models);

    const audit: AuditEvent[] = [
      { actorName: "Mateus Silva", action: "promoted Priya Kohli to analyst", target: "p.kohli@earthscape.io", createdAt: minsAgo(12) },
      { actorName: "Mateus Silva", action: "resolved ticket ER-2838 (humidity request)", target: "ER-2838", createdAt: daysAgo(1) },
      { actorName: "Yuki Tanaka", action: "saved dashboard \"Northern winter outlook\"", target: "Northern winter outlook", createdAt: minsAgo(120) },
      { actorName: "Aria Chen", action: "opened ticket ER-2841 about Lahore forecast", target: "ER-2841", createdAt: minsAgo(12) },
      { actorName: "Priya Kohli", action: "opened ticket ER-2837 about stale Karachi data", target: "ER-2837", createdAt: daysAgo(2) },
    ];
    await db.collection<AuditEvent>(Collections.auditEvents).insertMany(audit);

    return ok({
      ok: true,
      counts: {
        users: users.length,
        tickets: tickets.length,
        dashboards: dashboards.length,
        models: models.length,
        auditEvents: audit.length,
      },
      demoCredentials: {
        admin: { email: "admin@earthscape.io", password: "Climate2026!" },
        analyst: { email: "analyst@earthscape.io", password: "Climate2026!" },
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Seed failed";
    return bad(msg, 500);
  }
}

export async function GET() {
  return ok({
    info: "POST to this endpoint to seed the database with realistic demo data.",
    demoCredentials: {
      admin: { email: "admin@earthscape.io", password: "Climate2026!" },
      analyst: { email: "analyst@earthscape.io", password: "Climate2026!" },
    },
  });
}
