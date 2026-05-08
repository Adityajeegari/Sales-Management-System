import { Router, type IRouter } from "express";
import { desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import {
  db,
  notificationsTable,
  productsTable,
  salesTargetsTable,
  salesTable,
} from "@workspace/db";
import { requireRole, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

const requireViewer = requireRole("admin", "manager", "staff");

async function ensureLowStockNotifications(): Promise<void> {
  const lowStock = await db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.stock} <= ${productsTable.lowStockThreshold}`);
  if (lowStock.length === 0) return;
  for (const p of lowStock) {
    const existing = await db
      .select()
      .from(notificationsTable)
      .where(
        sql`${notificationsTable.type} = 'low_stock' AND ${notificationsTable.metadata} ->> 'productId' = ${String(p.id)} AND ${notificationsTable.read} = false`,
      )
      .limit(1);
    if (existing.length === 0) {
      await db.insert(notificationsTable).values({
        type: "low_stock",
        title: "Low stock alert",
        body: `${p.name} has only ${p.stock} units left (threshold ${p.lowStockThreshold}).`,
        metadata: { productId: p.id, sku: p.sku } as never,
      });
    }
  }
}

async function ensureTargetReminder(): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [target] = await db
    .select()
    .from(salesTargetsTable)
    .where(
      sql`${salesTargetsTable.year} = ${year} AND ${salesTargetsTable.month} = ${month}`,
    );
  if (!target || Number(target.targetAmount) <= 0) return;
  const start = new Date(year, now.getMonth(), 1);
  const end = new Date(year, now.getMonth() + 1, 1);
  const [agg] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
    })
    .from(salesTable)
    .where(
      sql`${salesTable.saleDate} >= ${start.toISOString()} AND ${salesTable.saleDate} < ${end.toISOString()} AND ${salesTable.status} = 'completed'`,
    );
  const achieved = Number(agg?.revenue ?? 0);
  const targetAmt = Number(target.targetAmount);
  const dim = new Date(year, now.getMonth() + 1, 0).getDate();
  const dayFraction = now.getDate() / dim;
  const expected = targetAmt * dayFraction;
  if (achieved < expected * 0.85) {
    const existing = await db
      .select()
      .from(notificationsTable)
      .where(
        sql`${notificationsTable.type} = 'target_pacing' AND ${notificationsTable.read} = false AND DATE(${notificationsTable.createdAt}) = CURRENT_DATE`,
      )
      .limit(1);
    if (existing.length === 0) {
      const pct = Math.round((achieved / targetAmt) * 100);
      await db.insert(notificationsTable).values({
        type: "target_pacing",
        title: "Target pacing reminder",
        body: `You're at ${pct}% of this month's target — push the team!`,
        metadata: { achieved, target: targetAmt } as never,
      });
    }
  }
}

router.get("/notifications", requireViewer, async (req, res) => {
  await Promise.all([ensureLowStockNotifications(), ensureTargetReminder()]);
  const auth = req as AuthedRequest;
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(
      or(
        isNull(notificationsTable.salesOsUserId),
        auth.userId
          ? eq(notificationsTable.salesOsUserId, auth.userId)
          : isNull(notificationsTable.salesOsUserId),
      ),
    )
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(
    rows.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: new Date(n.createdAt).toISOString(),
    })),
  );
});

router.post("/notifications/read-all", requireViewer, async (req, res) => {
  const auth = req as AuthedRequest;
  const rows = await db
    .select({ id: notificationsTable.id })
    .from(notificationsTable)
    .where(
      or(
        isNull(notificationsTable.salesOsUserId),
        auth.userId
          ? eq(notificationsTable.salesOsUserId, auth.userId)
          : isNull(notificationsTable.salesOsUserId),
      ),
    );
  if (rows.length) {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(
        inArray(
          notificationsTable.id,
          rows.map((r) => r.id),
        ),
      );
  }
  res.sendStatus(204);
});

export default router;
