import { Router, type IRouter } from "express";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db, salesTargetsTable, salesTable } from "@workspace/db";
import { SetCurrentTargetBody } from "@workspace/api-zod";
import { requireRole, type AuthedRequest } from "../lib/auth";
import { broadcastNotification, logActivity } from "../lib/activity";

const router: IRouter = Router();

const requireViewer = requireRole("admin", "manager", "staff");
const requireEditor = requireRole("admin", "manager");

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfNextMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}
function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

async function buildProgress() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [target] = await db
    .select()
    .from(salesTargetsTable)
    .where(
      and(
        eq(salesTargetsTable.year, year),
        eq(salesTargetsTable.month, month),
      ),
    );
  const targetAmount = Number(target?.targetAmount ?? 0);

  const start = startOfMonth(now);
  const end = startOfNextMonth(now);
  const [agg] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
    })
    .from(salesTable)
    .where(
      and(
        gte(salesTable.saleDate, start),
        lte(salesTable.saleDate, end),
        eq(salesTable.status, "completed"),
      ),
    );
  const achievedAmount = Number(agg?.revenue ?? 0);
  const progressPercent =
    targetAmount > 0
      ? Math.min(100, Math.round((achievedAmount / targetAmount) * 1000) / 10)
      : 0;
  const dim = daysInMonth(now);
  const elapsed = Math.min(dim, now.getDate());

  return {
    year,
    month,
    targetAmount,
    achievedAmount,
    progressPercent,
    daysElapsed: elapsed,
    daysInMonth: dim,
  };
}

router.get("/targets/current", requireViewer, async (_req, res) => {
  res.json(await buildProgress());
});

router.put("/targets/current", requireEditor, async (req, res) => {
  const parsed = SetCurrentTargetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [existing] = await db
    .select()
    .from(salesTargetsTable)
    .where(
      and(
        eq(salesTargetsTable.year, year),
        eq(salesTargetsTable.month, month),
      ),
    );
  if (existing) {
    await db
      .update(salesTargetsTable)
      .set({ targetAmount: String(parsed.data.targetAmount) })
      .where(eq(salesTargetsTable.id, existing.id));
  } else {
    await db.insert(salesTargetsTable).values({
      year,
      month,
      targetAmount: String(parsed.data.targetAmount),
    });
  }
  const auth = req as AuthedRequest;
  await logActivity({
    salesOsUserId: auth.userId,
    actorName: auth.userRole?.name,
    actorEmail: auth.userRole?.email,
    action: "update",
    entityType: "target",
    summary: `Set ${year}-${String(month).padStart(2, "0")} target to ₹${parsed.data.targetAmount}`,
  });
  await broadcastNotification({
    type: "target_set",
    title: "New monthly target set",
    body: `Team target for this month is ₹${parsed.data.targetAmount.toLocaleString("en-IN")}.`,
  });
  res.json(await buildProgress());
});

export default router;
