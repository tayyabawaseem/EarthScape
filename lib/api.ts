import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireUser(): Promise<
  { user: SessionPayload } | { error: ReturnType<typeof unauthorized> }
> {
  const user = await getSession();
  if (!user) return { error: unauthorized() };
  return { user };
}

export async function requireAdmin(): Promise<
  { user: SessionPayload } | { error: ReturnType<typeof unauthorized> }
> {
  const user = await getSession();
  if (!user) return { error: unauthorized() };
  if (user.role !== "admin") return { error: forbidden() };
  return { user };
}
