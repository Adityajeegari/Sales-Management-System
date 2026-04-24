import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lt, ne, sql } from "drizzle-orm";
import { db, salesTable, customersTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetSalesTrendQueryParams,
  GetSalesTrendResponse,
  GetCategoryDistributionResponse,
  GetTopProductsQueryParams,
  GetTopProductsResponse,
  GetRecentSalesQueryParams,
  GetRecentSalesResponse,
  GetSalesForecastQueryParams,
  GetSalesForecastResponse,
} from "@workspace/api-zod";
import { requireRole } from "../lib/auth";
const requireViewer = requireRole("admin", "manager", "staff");
import { serializeSale } from "../lib/serializers";

const router: IRouter = Router();

router.use(requireViewer);

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}
function formatMonth(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

router.get("/analytics/summary", async (_req, res): Promise<void> => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const prevMonthStart = addMonths(monthStart, -1);

  const completed = ne(salesTable.status, "cancelled");

  const [allAgg] = await db
    .select({
      totalRevenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
    })
    .from(salesTable)
    .where(completed);

  const [thisMonth] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
      cnt: sql<string>`COUNT(*)`,
    })
    .from(salesTable)
    .where(and(completed, gte(salesTable.saleDate, monthStart)));

  const [lastMonth] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
    })
    .from(salesTable)
    .where(
      and(
        completed,
        gte(salesTable.saleDate, prevMonthStart),
        lt(salesTable.saleDate, monthStart),
      ),
    );

  const [activeCustomersRow] = await db
    .select({
      cnt: sql<string>`COUNT(DISTINCT ${customersTable.id})`,
    })
    .from(customersTable);

  const [pendingRow] = await db
    .select({
      cnt: sql<string>`COUNT(*)`,
    })
    .from(salesTable)
    .where(eq(salesTable.status, "pending"));

  const totalRevenue = Number(allAgg?.totalRevenue ?? 0);
  const monthlyRevenue = Number(thisMonth?.revenue ?? 0);
  const monthlySalesCount = Number(thisMonth?.cnt ?? 0);
  const lastMonthRevenue = Number(lastMonth?.revenue ?? 0);
  const revenueGrowthPercent =
    lastMonthRevenue === 0
      ? monthlyRevenue > 0
        ? 100
        : 0
      : ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
  const averageOrderValue =
    monthlySalesCount > 0 ? monthlyRevenue / monthlySalesCount : 0;

  const data = {
    totalRevenue,
    monthlyRevenue,
    monthlySalesCount,
    activeCustomers: Number(activeCustomersRow?.cnt ?? 0),
    revenueGrowthPercent: Math.round(revenueGrowthPercent * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    pendingOrders: Number(pendingRow?.cnt ?? 0),
  };
  res.json(GetDashboardSummaryResponse.parse(data));
});

router.get("/analytics/sales-trend", async (req, res): Promise<void> => {
  const parsed = GetSalesTrendQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const months = parsed.data.months ?? 12;
  const now = new Date();
  const start = addMonths(startOfMonth(now), -(months - 1));

  const rows = await db
    .select({
      period: sql<string>`to_char(date_trunc('month', ${salesTable.saleDate}), 'YYYY-MM')`,
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
      orders: sql<string>`COUNT(*)`,
    })
    .from(salesTable)
    .where(
      and(ne(salesTable.status, "cancelled"), gte(salesTable.saleDate, start)),
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

  const out: { period: string; revenue: number; orders: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = addMonths(start, i);
    const period = formatMonth(d);
    const v = map.get(period) ?? { revenue: 0, orders: 0 };
    out.push({ period, revenue: v.revenue, orders: v.orders });
  }
  res.json(GetSalesTrendResponse.parse(out));
});

router.get(
  "/analytics/category-distribution",
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        category: salesTable.category,
        revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
        orders: sql<string>`COUNT(*)`,
      })
      .from(salesTable)
      .where(ne(salesTable.status, "cancelled"))
      .groupBy(salesTable.category)
      .orderBy(sql`COALESCE(SUM(${salesTable.total}), 0) DESC`);

    const data = rows.map((r) => ({
      category: r.category,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    }));
    res.json(GetCategoryDistributionResponse.parse(data));
  },
);

router.get("/analytics/top-products", async (req, res): Promise<void> => {
  const parsed = GetTopProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 5;
  const rows = await db
    .select({
      productName: salesTable.productName,
      quantitySold: sql<string>`COALESCE(SUM(${salesTable.quantity}), 0)`,
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
    })
    .from(salesTable)
    .where(ne(salesTable.status, "cancelled"))
    .groupBy(salesTable.productName)
    .orderBy(sql`COALESCE(SUM(${salesTable.total}), 0) DESC`)
    .limit(limit);

  const data = rows.map((r) => ({
    productName: r.productName,
    quantitySold: Number(r.quantitySold),
    revenue: Number(r.revenue),
  }));
  res.json(GetTopProductsResponse.parse(data));
});

router.get("/analytics/recent-sales", async (req, res): Promise<void> => {
  const parsed = GetRecentSalesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 8;
  const rows = await db
    .select({ sale: salesTable, customerName: customersTable.name })
    .from(salesTable)
    .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
    .orderBy(desc(salesTable.saleDate))
    .limit(limit);
  const data = rows.map((r) => serializeSale(r.sale, r.customerName ?? null));
  res.json(GetRecentSalesResponse.parse(data));
});

router.get("/analytics/forecast", async (req, res): Promise<void> => {
  const parsed = GetSalesForecastQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const horizon = parsed.data.months ?? 3;

  // Simple linear regression over the last 6 months of revenue.
  const lookback = 6;
  const now = new Date();
  const start = addMonths(startOfMonth(now), -(lookback - 1));

  const rows = await db
    .select({
      period: sql<string>`to_char(date_trunc('month', ${salesTable.saleDate}), 'YYYY-MM')`,
      revenue: sql<string>`COALESCE(SUM(${salesTable.total}), 0)`,
    })
    .from(salesTable)
    .where(
      and(ne(salesTable.status, "cancelled"), gte(salesTable.saleDate, start)),
    )
    .groupBy(sql`date_trunc('month', ${salesTable.saleDate})`)
    .orderBy(sql`date_trunc('month', ${salesTable.saleDate})`);

  const map = new Map<string, number>();
  for (const r of rows) map.set(r.period, Number(r.revenue));

  const ys: number[] = [];
  for (let i = 0; i < lookback; i++) {
    const d = addMonths(start, i);
    ys.push(map.get(formatMonth(d)) ?? 0);
  }

  // Linear regression: y = a + b*x, x = 0..lookback-1
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  const b = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;

  const out: { period: string; projectedRevenue: number }[] = [];
  for (let i = 1; i <= horizon; i++) {
    const x = lookback - 1 + i;
    const projected = Math.max(0, a + b * x);
    const d = addMonths(startOfMonth(now), i);
    out.push({
      period: formatMonth(d),
      projectedRevenue: Math.round(projected * 100) / 100,
    });
  }
  res.json(GetSalesForecastResponse.parse(out));
});

export default router;
