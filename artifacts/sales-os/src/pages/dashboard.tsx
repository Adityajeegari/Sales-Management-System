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
} from "@workspace/api-client-react";

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

  const summary = summaryQ.data;

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
            value: formatCurrency(summary?.totalRevenue ?? 0),
            icon: Wallet,
          },
          {
            label: "This month",
            value: formatCurrency(summary?.monthlyRevenue ?? 0),
            delta: summary?.revenueGrowthPercent,
            icon: TrendingUp,
          },
          {
            label: "Orders this month",
            value: formatNumber(summary?.monthlySalesCount ?? 0),
            icon: ShoppingBag,
          },
          {
            label: "Active customers",
            value: formatNumber(summary?.activeCustomers ?? 0),
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
                loading={summaryQ.isLoading}
              />
            </motion.div>
          ))}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue trend</CardTitle>
            <span className="text-xs text-muted-foreground">Last 12 months</span>
          </CardHeader>
          <CardContent className="h-[280px] pl-0">
            {trendQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={(trendQ.data ?? []).map((p) => ({
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
            {categoryQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (categoryQ.data ?? []).length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <div className="grid h-full grid-cols-[1fr_auto] items-center gap-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryQ.data}
                      dataKey="revenue"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {(categoryQ.data ?? []).map((_, idx) => (
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
                  {(categoryQ.data ?? []).slice(0, 5).map((c, idx) => (
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
            {recentQ.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (recentQ.data ?? []).length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No sales recorded yet.
              </div>
            ) : (
              <div className="divide-y">
                {(recentQ.data ?? []).map((s) => (
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
            {topProductsQ.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (topProductsQ.data ?? []).length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Not enough data yet.
              </div>
            ) : (
              <ol className="space-y-3">
                {(topProductsQ.data ?? []).map((p, idx) => (
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
          {forecastQ.isLoading ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {(forecastQ.data ?? []).map((f) => (
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
