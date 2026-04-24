import { Router, type IRouter } from "express";
import { and, gte, lt, ne, sql } from "drizzle-orm";
import { db, salesTable } from "@workspace/db";
import {
  GetMonthlyReportQueryParams,
  GetMonthlyReportResponse,
  GetYearlyReportResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(requireAuth);

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

export default router;
