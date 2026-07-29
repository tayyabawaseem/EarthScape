import type { ObjectId } from "mongodb";

export type Role = "admin" | "analyst";

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  region?: string;
  timezone?: string;
  lastActiveAt?: Date;
  createdAt: Date;
}

export interface Ticket {
  _id?: ObjectId;
  ticketId: string;
  subject: string;
  body?: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  _id?: ObjectId;
  type: "bug" | "idea" | "question";
  subject: string;
  body: string;
  createdBy: string;
  createdAt: Date;
}

export interface Dashboard {
  _id?: ObjectId;
  name: string;
  description?: string;
  panels: { kind: string; source: string; range: string }[];
  shared: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelRecord {
  _id?: ObjectId;
  name: string;
  algorithm: string;
  task: string;
  accuracy: number;
  status: "live" | "training" | "stale";
  runs: number;
  lastTrainedAt?: Date;
  createdAt: Date;
}

export interface AuditEvent {
  _id?: ObjectId;
  actorId?: string;
  actorName: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export const Collections = {
  users: "users",
  tickets: "tickets",
  feedback: "feedback",
  dashboards: "dashboards",
  models: "models",
  auditEvents: "audit_events",
} as const;
