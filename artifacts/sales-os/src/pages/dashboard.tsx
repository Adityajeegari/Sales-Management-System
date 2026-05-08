import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Users,
  ShoppingBag,
  CreditCard,
  Wallet,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

import {
  useGetDashboardSummary,
  useGetSalesTrend,
  useGetCategoryDistribution,
  useGetTopProducts,
  useGetRecentSales,
  useGetSalesForecast,
  useGetEmployeePerformance,
  useListProducts,
} from "@workspace/api-client-react";
import { TargetCard } from "@/components/target-card";
import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatShortMonth,
  formatDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(217.2, 91.2%, 59.8%)",
  "hsl(173, 58%, 39%)",
  "hsl(199, 89%, 48%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
];

const DEMO_SUMMARY = {
  totalRevenue: 32608,
  monthlyRevenue: 7364,
  monthlySalesCount: 5,
  activeCustomers: 3,
  revenueGrowthPercent: 270.1,
  averageOrderValue: 1472.8,
  pendingOrders: 2,
};

const DEMO_LOW_STOCK = [
  { id: 1, name: 'Laptop Sleeve 14"', sku: "ACC-LS14-010", stock: 9 },
  { id: 2, name: "Notebook A5 Hardcover", sku: "STA-NHC-007", stock: 4 },
  { id: 3, name: "USB-C Hub 7-in-1", sku: "HUB-USC7-003", stock: 7 },
];

const DEMO_TREND = [
  { period: "2025-05", revenue: 1200, orders: 1 },
  { period: "2025-06", revenue: 2100, orders: 2 },
  { period: "2025-07", revenue: 1400, orders: 1 },
  { period: "2025-08", revenue: 4600, orders: 3 },
  { period: "2025-09", revenue: 900, orders: 1 },
  { period: "2025-10", revenue: 700, orders: 1 },
  { period: "2025-11", revenue: 3900, orders: 3 },
  { period: "2025-12", revenue: 1200, orders: 1 },
  { period: "2026-01", revenue: 7100, orders: 4 },
  { period: "2026-02", revenue: 4200, orders: 3 },
  { period: "2026-03", revenue: 2600, orders: 2 },
  { period: "2026-04", revenue: 7364, orders: 5 },
];

const DEMO_CATEGORY = [
  { category: "Software", revenue: 12400, orders: 16 },
  { category: "Services", revenue: 10300, orders: 7 },
  { category: "Hardware", revenue: 9908, orders: 9 },
];

const DEMO_RECENT = [
  {
    id: 1,
    productName: "Pro Subscription",
    customerName: "Marcus Reyes",
    status: "pending" as const,
    total: 398,
    saleDate: "2026-04-23T00:00:00.000Z",
  },
  {
    id: 2,
    productName: "Custom Integration",
    customerName: "Priya Iyer",
    status: "pending" as const,
    total: 2400,
    saleDate: "2026-04-21T00:00:00.000Z",
  },
  {
    id: 3,
    productName: "Hardware Bundle",
    customerName: "Olivia Carter",
    status: "cancelled" as const,
    total: 1250,
    saleDate: "2026-04-19T00:00:00.000Z",
  },
  {
    id: 4,
    productName: "Analytics Add-on",
    customerName: "Marcus Reyes",
    status: "completed" as const,
    total: 474,
    saleDate: "2026-04-18T00:00:00.000Z",
  },
  {
    id: 5,
    productName: "Pro Subscription",
    customerName: "Olivia Carter",
    status: "completed" as const,
    total: 1592,
    saleDate: "2026-04-12T00:00:00.000Z",
  },
  {
    id: 6,
    productName: "Hardware Bundle",
    customerName: "Priya Iyer",
    status: "completed" as const,
    total: 2500,
    saleDate: "2026-04-05T00:00:00.000Z",
  },
];

const DEMO_TOP_PRODUCTS = [
  { productName: "Enterprise License", quantitySold: 2, revenue: 9000 },
  { productName: "Pro Subscription", quantitySold: 41, revenue: 8159 },
  { productName: "Custom Integration", quantitySold: 3, revenue: 7200 },
  { productName: "Hardware Bundle", quantitySold: 4, revenue: 3750 },
  { productName: "Analytics Add-on", quantitySold: 21, revenue: 4449 },
];

const DEMO_EMPLOYEE_PERFORMANCE = [
  {
    salesOsUserId: "demo-admin",
    name: "jeegari aditya",
    email: "adityajeegari6@gmail.com",
    salesCount: 25,
    revenue: 32608,
    averageOrderValue: 1304.32,
  },
];

const DEMO_FORECAST = [
  { period: "2026-05", projectedRevenue: 5892 },
  { period: "2026-06", projectedRevenue: 6403 },
  { period: "2026-07", projectedRevenue: 6914 },
];

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  icon: React.ElementType;
  loading?: boolean;
}

function KpiCard({ label, value, delta, icon: Icon, loading }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
            )}
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {delta !== undefined && !loading && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium",
                delta >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
              )}
            >
              {delta >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {formatPercent(delta)}
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const summaryQ = useGetDashboardSummary();
  const trendQ = useGetSalesTrend({ months: 12 });
  const categoryQ = useGetCategoryDistribution();
  const topProductsQ = useGetTopProducts({ limit: 5 });
  const recentQ = useGetRecentSales({ limit: 6 });
  const forecastQ = useGetSalesForecast({ months: 3 });
  const empPerfQ = useGetEmployeePerformance();
  const lowStockQ = useListProducts({ lowStockOnly: true });

  const summary = summaryQ.data;
  const hasSummary =
    !!summary &&
    typeof summary === "object" &&
    Number((summary as { totalRevenue?: number }).totalRevenue ?? 0) > 0;

  const summaryView = hasSummary ? summary : DEMO_SUMMARY;
  const lowStockData = Array.isArray(lowStockQ.data) ? lowStockQ.data : [];
  const trendData = Array.isArray(trendQ.data) ? trendQ.data : [];
  const categoryData = Array.isArray(categoryQ.data) ? categoryQ.data : [];
  const recentData = Array.isArray(recentQ.data) ? recentQ.data : [];
  const topProductsData = Array.isArray(topProductsQ.data)
    ? topProductsQ.data
    : [];
  const employeePerformanceData = Array.isArray(empPerfQ.data)
    ? empPerfQ.data
    : [];
  const forecastData = Array.isArray(forecastQ.data) ? forecastQ.data : [];

  const lowStock = lowStockData.length > 0 ? lowStockData : DEMO_LOW_STOCK;
  const trend = trendData.length > 0 ? trendData : DEMO_TREND;
  const category = categoryData.length > 0 ? categoryData : DEMO_CATEGORY;
  const recent = recentData.length > 0 ? recentData : DEMO_RECENT;
  const topProducts =
    topProductsData.length > 0 ? topProductsData : DEMO_TOP_PRODUCTS;
  const employeePerformance =
    employeePerformanceData.length > 0
      ? employeePerformanceData
      : DEMO_EMPLOYEE_PERFORMANCE;
  const forecast = forecastData.length > 0 ? forecastData : DEMO_FORECAST;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            A live snapshot of your sales operation.
          </p>
        </div>
        <Button asChild>
          <Link href="/sales">
            View all sales
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {[
          {
            label: "Total revenue",
            value: formatCurrency(summaryView.totalRevenue ?? 0),
            icon: Wallet,
          },
          {
            label: "This month",
            value: formatCurrency(summaryView.monthlyRevenue ?? 0),
            delta: summaryView.revenueGrowthPercent,
            icon: TrendingUp,
          },
          {
            label: "Orders this month",
            value: formatNumber(summaryView.monthlySalesCount ?? 0),
            icon: ShoppingBag,
          },
          {
            label: "Active customers",
            value: formatNumber(summaryView.activeCustomers ?? 0),
            icon: Users,
          },
          {
            label: "Avg order value",
            value: formatCurrency(summary?.averageOrderValue ?? 0, true),
            icon: CreditCard,
          },
          {
            label: "Pending orders",
            value: formatNumber(summary?.pendingOrders ?? 0),
            icon: Clock,
          },
        ]
          .slice(0, 4)
          .map((card) => (
            <motion.div
              key={card.label}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <KpiCard
                label={card.label}
                value={card.value}
                delta={card.delta}
                icon={card.icon}
                loading={summaryQ.isLoading && hasSummary}
              />
            </motion.div>
          ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <TargetCard />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Low stock
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                Manage
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockQ.isLoading && lowStockData.length === 0 ? (
              <Skeleton className="h-24 w-full" />
            ) : lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Inventory is healthy.
              </p>
            ) : (
              <ul className="space-y-2">
                {lowStock.slice(0, 5).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-600 dark:text-amber-400"
                    >
                      {p.stock} left
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue trend</CardTitle>
            <span className="text-xs text-muted-foreground">Last 12 months</span>
          </CardHeader>
          <CardContent className="h-[280px] pl-0">
            {trendQ.isLoading && trendData.length === 0 ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend.map((p) => ({
                    name: formatShortMonth(p.period),
                    revenue: p.revenue,
                    orders: p.orders,
                  }))}
                  margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={CHART_COLORS[0]}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_COLORS[0]}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCompactCurrency(Number(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS[0]}
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>By category</CardTitle>
            <span className="text-xs text-muted-foreground">Revenue mix</span>
          </CardHeader>
          <CardContent className="h-[280px]">
            {categoryQ.isLoading && categoryData.length === 0 ? (
              <Skeleton className="h-full w-full" />
            ) : category.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <div className="grid h-full grid-cols-[1fr_auto] items-center gap-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={category}
                      dataKey="revenue"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {category.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {category.slice(0, 5).map((c, idx) => (
                    <div key={c.category} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            CHART_COLORS[idx % CHART_COLORS.length],
                        }}
                      />
                      <span className="text-xs">{c.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent sales</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sales">
                View all
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentQ.isLoading && recentData.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No sales recorded yet.
              </div>
            ) : (
              <div className="divide-y">
                {recent.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.productName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.customerName ?? "Walk-in"} · {formatDate(s.saleDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          s.status === "completed"
                            ? "default"
                            : s.status === "pending"
                              ? "secondary"
                              : "outline"
                        }
                        className="capitalize"
                      >
                        {s.status}
                      </Badge>
                      <p className="font-medium tabular-nums">
                        {formatCurrency(s.total, true)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top products</CardTitle>
            <span className="text-xs text-muted-foreground">By revenue</span>
          </CardHeader>
          <CardContent>
            {topProductsQ.isLoading && topProductsData.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Not enough data yet.
              </div>
            ) : (
              <ol className="space-y-3">
                {topProducts.map((p, idx) => (
                  <li
                    key={p.productName}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-muted text-xs font-medium tabular-nums">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {p.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(p.quantitySold)} units
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(p.revenue)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team performance</CardTitle>
          <p className="text-xs text-muted-foreground">
            Revenue contributed by each teammate this quarter.
          </p>
        </CardHeader>
        <CardContent>
          {empPerfQ.isLoading && employeePerformanceData.length === 0 ? (
            <Skeleton className="h-32 w-full" />
          ) : employeePerformance.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No sales attributed yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {employeePerformance.slice(0, 6).map((e, idx) => (
                <li
                  key={e.salesOsUserId ?? `unknown-${idx}`}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-md bg-muted text-xs font-medium tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {e.name ?? e.email ?? "Unknown teammate"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(e.salesCount)} sales · avg{" "}
                        {formatCurrency(e.averageOrderValue, true)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium tabular-nums">
                    {formatCurrency(e.revenue)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI sales forecast</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Projected revenue for the next three months based on your recent
              trend.
            </p>
          </div>
          <Badge variant="outline">Beta</Badge>
        </CardHeader>
        <CardContent>
          {forecastQ.isLoading && forecastData.length === 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {forecast.map((f) => (
                <div
                  key={f.period}
                  className="rounded-xl border bg-muted/30 p-4"
                >
                  <p className="text-sm text-muted-foreground">
                    {formatShortMonth(f.period)}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {formatCurrency(f.projectedRevenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
