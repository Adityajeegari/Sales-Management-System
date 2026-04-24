import type { Request, Response, NextFunction } from "express";
import { count, eq } from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import {
  db,
  userRolesTable,
  type UserRole,
  type RoleName,
} from "@workspace/db";

export interface AuthedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
}

async function fetchClerkProfile(
  clerkUserId: string,
): Promise<{ email: string | null; name: string | null }> {
  try {
    const u = await clerkClient.users.getUser(clerkUserId);
    const email =
      u.primaryEmailAddress?.emailAddress ??
      u.emailAddresses[0]?.emailAddress ??
      null;
    const name =
      [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || null;
    return { email, name };
  } catch {
    return { email: null, name: null };
  }
}

export async function getOrCreateUserRole(
  clerkUserId: string,
): Promise<UserRole> {
  const [existing] = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.clerkUserId, clerkUserId));
  if (existing) {
    if (!existing.email || !existing.name) {
      const profile = await fetchClerkProfile(clerkUserId);
      const [updated] = await db
        .update(userRolesTable)
        .set({
          email: existing.email ?? profile.email,
          name: existing.name ?? profile.name,
        })
        .where(eq(userRolesTable.id, existing.id))
        .returning();
      return updated ?? existing;
    }
    return existing;
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(userRolesTable);
  const isFirstUser = Number(total ?? 0) === 0;
  const profile = await fetchClerkProfile(clerkUserId);
  const [created] = await db
    .insert(userRolesTable)
    .values({
      clerkUserId,
      email: profile.email,
      name: profile.name,
      role: isFirstUser ? "admin" : "staff",
    })
    .returning();
  return created;
}

export function requireRole(...allowed: RoleName[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const auth = getAuth(req);
    const clerkUserId = (auth?.sessionClaims?.userId as string) || auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const userRole = await getOrCreateUserRole(String(clerkUserId));
      if (!allowed.includes(userRole.role as RoleName)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      (req as AuthedRequest).userId = String(clerkUserId);
      (req as AuthedRequest).userRole = userRole;
      next();
    } catch (err) {
      res
        .status(500)
        .json({ error: err instanceof Error ? err.message : "Auth error" });
    }
  };
}
