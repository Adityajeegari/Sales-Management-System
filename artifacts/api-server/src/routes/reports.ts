import { Router, type IRouter } from "express";
import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import { db, salesTable, productsTable, userRolesTable } from "@workspace/db";
import {
  GetMonthlyReportQueryParams,
  GetMonthlyReportResponse,
  GetYearlyReportResponse,
  GetProfitLossQueryParams,
} from "@workspace/api-zod";
import { requireRole } from "../lib/auth";
const requireViewer = requireRole("admin", "manager", "staff");

const router: IRouter = Router();

router.use(requireViewer);

interface AggRow {
  period: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  growthPercent: number;
}

function withGrowth(
  items: { period: string; revenue: number; orders: number }[],
): AggRow[] {
  return items.map((item, idx) => {
    const prev = items[idx - 1];
    const growth =
      !prev || prev.revenue === 0
        ? idx === 0
          ? 0
          : item.revenue > 0
            ? 100
            : 0
        : ((item.revenue - prev.revenue) / prev.revenue) * 100;
    return {
      period: item.period,
      revenue: item.revenue,
      orders: item.orders,
      averageOrderValue:
        item.orders > 0
          ? Math.round((item.revenue / item.orders) * 100) / 100
          : 0,
      growthPercent: Math.round(growth * 100) / 100,
    };
  });
}

router.get("/reports/monthly", async (req, res): Promise<void> => {
  const parsed = GetMonthlyReportQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const year = parsed.data.year ?? new Date().getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await db
    .select({
      period: sql<string>`to_char(date_trunc('month', ${salesTable.saleDate}), 'YYYY-MM')`,
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
      orders: sql<string>`COUNT(*)`,
    })
    .from(salesTable)
    .where(
      and(
        ne(salesTable.status, "cancelled"),
        gte(salesTable.saleDate, yearStart),
        lt(salesTable.saleDate, yearEnd),
      ),
    )
    .groupBy(sql`date_trunc('month', ${salesTable.saleDate})`)
    .orderBy(sql`date_trunc('month', ${salesTable.saleDate})`);

  const map = new Map<string, { revenue: number; orders: number }>();
  for (const r of rows) {
    map.set(r.period, {
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    });
  }
  const items: { period: string; revenue: number; orders: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const period = `${year}-${String(m + 1).padStart(2, "0")}`;
    const v = map.get(period) ?? { revenue: 0, orders: 0 };
    items.push({ period, revenue: v.revenue, orders: v.orders });
  }
  res.json(GetMonthlyReportResponse.parse(withGrowth(items)));
});

router.get("/reports/yearly", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      period: sql<string>`to_char(date_trunc('year', ${salesTable.saleDate}), 'YYYY')`,
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
      orders: sql<string>`COUNT(*)`,
    })
    .from(salesTable)
    .where(ne(salesTable.status, "cancelled"))
    .groupBy(sql`date_trunc('year', ${salesTable.saleDate})`)
    .orderBy(sql`date_trunc('year', ${salesTable.saleDate})`);

  const items = rows.map((r) => ({
    period: r.period,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));
  res.json(GetYearlyReportResponse.parse(withGrowth(items)));
});

router.get("/reports/employee-performance", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      clerkUserId: salesTable.createdByClerkId,
      name: userRolesTable.name,
      email: userRolesTable.email,
      salesCount: sql<string>`COUNT(*)`,
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
    })
    .from(salesTable)
    .leftJoin(
      userRolesTable,
      eq(salesTable.createdByClerkId, userRolesTable.clerkUserId),
    )
    .where(ne(salesTable.status, "cancelled"))
    .groupBy(salesTable.createdByClerkId, userRolesTable.name, userRolesTable.email)
    .orderBy(sql`COALESCE(SUM(${salesTable.total}), 0) DESC`);

  const result = rows.map((r) => {
    const salesCount = Number(r.salesCount);
    const revenue = Number(r.revenue);
    return {
      clerkUserId: r.clerkUserId ?? null,
      name: r.name ?? null,
      email: r.email ?? null,
      salesCount,
      revenue,
      averageOrderValue:
        salesCount > 0 ? Math.round((revenue / salesCount) * 100) / 100 : 0,
    };
  });
  res.json(result);
});

router.get("/reports/profit-loss", async (req, res): Promise<void> => {
  const parsed = GetProfitLossQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const year = parsed.data.year ?? new Date().getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await db
    .select({
      period: sql<string>`to_char(date_trunc('month', ${salesTable.saleDate}), 'YYYY-MM')`,
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
      cost: sql<string>`COALESCE(SUM(${salesTable.quantity} * COALESCE(${productsTable.costPrice}, 0)), 0)`,
    })
    .from(salesTable)
    .leftJoin(productsTable, eq(salesTable.productId, productsTable.id))
    .where(
      and(
        ne(salesTable.status, "cancelled"),
        gte(salesTable.saleDate, yearStart),
        lt(salesTable.saleDate, yearEnd),
      ),
    )
    .groupBy(sql`date_trunc('month', ${salesTable.saleDate})`)
    .orderBy(sql`date_trunc('month', ${salesTable.saleDate})`);

  const map = new Map<string, { revenue: number; cost: number }>();
  for (const r of rows) {
    map.set(r.period, { revenue: Number(r.revenue), cost: Number(r.cost) });
  }
  const items = [];
  for (let m = 0; m < 12; m++) {
    const period = `${year}-${String(m + 1).padStart(2, "0")}`;
    const v = map.get(period) ?? { revenue: 0, cost: 0 };
    const profit = v.revenue - v.cost;
    items.push({
      period,
      revenue: v.revenue,
      cost: v.cost,
      profit,
      marginPercent:
        v.revenue > 0 ? Math.round((profit / v.revenue) * 1000) / 10 : 0,
    });
  }
  res.json(items);
});

export default router;
