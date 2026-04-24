import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, userRolesTable, type RoleName } from "@workspace/db";
import { getOrCreateUserRole, requireRole } from "../lib/auth";

const router: IRouter = Router();

const ROLES: RoleName[] = ["admin", "manager", "staff"];
function isRole(v: unknown): v is RoleName {
  return typeof v === "string" && (ROLES as string[]).includes(v);
}

function serializeMember(u: {
  id: number;
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role: string;
  createdAt: Date;
}) {
  return {
    id: u.id,
    clerkUserId: u.clerkUserId,
    email: u.email,
    name: u.name,
    role: u.role as RoleName,
    createdAt: new Date(u.createdAt).toISOString(),
  };
}

router.get(
  "/me",
  requireRole("admin", "manager", "staff"),
  async (req, res): Promise<void> => {
    const userId = (req as { userId?: string }).userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const role = await getOrCreateUserRole(userId);
    res.json({
      id: role.id,
      clerkUserId: role.clerkUserId,
      email: role.email,
      name: role.name,
      role: role.role as RoleName,
    });
  },
);

router.get(
  "/users",
  requireRole("admin"),
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(userRolesTable)
      .orderBy(asc(userRolesTable.createdAt));
    res.json(rows.map(serializeMember));
  },
);

router.patch(
  "/users/:id/role",
  requireRole("admin"),
  async (req, res): Promise<void> => {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const newRole = (req.body as { role?: unknown })?.role;
    if (!isRole(newRole)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const requesterId = (req as { userId?: string }).userId;
    const [target] = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.id, targetId));
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Prevent removing the last admin
    if (target.role === "admin" && newRole !== "admin") {
      const admins = await db
        .select()
        .from(userRolesTable)
        .where(eq(userRolesTable.role, "admin"));
      if (admins.length <= 1) {
        const isSelf = target.clerkUserId === requesterId;
        res.status(400).json({
          error: isSelf
            ? "You cannot demote yourself as the only admin"
            : "Cannot remove the last admin",
        });
        return;
      }
    }

    const [updated] = await db
      .update(userRolesTable)
      .set({ role: newRole })
      .where(eq(userRolesTable.id, targetId))
      .returning();
    res.json(serializeMember(updated));
  },
);

export default router;
