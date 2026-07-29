import { getDb } from "./mongodb";
import { Collections, type AuditEvent } from "./models";
import type { SessionPayload } from "./auth";

type AuditInput = {
  actor: SessionPayload | { uid?: string; name?: string };
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
};

export async function recordAudit({ actor, action, target, metadata }: AuditInput): Promise<void> {
  try {
    const db = await getDb();
    const doc: AuditEvent = {
      actorId: actor && "uid" in actor ? (actor as { uid?: string }).uid : undefined,
      actorName: (actor && "name" in actor && (actor as { name?: string }).name) || "System",
      action,
      target,
      metadata,
      createdAt: new Date(),
    };
    await db.collection<AuditEvent>(Collections.auditEvents).insertOne(doc);
  } catch (e) {
    // Audit logging should never block the original request.
    console.error("[audit] failed to record event", action, e);
  }
}
