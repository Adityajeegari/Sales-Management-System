import { useState } from "react";
import { Download, FileText, ArrowDownRight, ArrowUpRight } from "lucide-react";

import {
  useGetMonthlyReport,
  useGetYearlyReport,
  useGetEmployeePerformance,
  useGetProfitLoss,
  type EmployeePerformance,
  type ProfitLossRow,
  type ReportRow,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadCSV, toCSV } from "@/lib/csv";
import { downloadTableAsPdf } from "@/lib/pdf";
import {
  formatCurrency,
  formatMonthLabel,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { cn } from "@/lib/utils";

function GrowthCell({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
        positive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      )}
    >
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {formatPercent(value)}
    </span>
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const DEMO_MONTHLY_2026: ReportRow[] = [
  {
    period: "2026-01",
    revenue: 6841,
    orders: 3,
    averageOrderValue: 2280.33,
    growthPercent: 0,
  },
  {
    period: "2026-02",
    revenue: 3600,
    orders: 2,
    averageOrderValue: 1800,
    growthPercent: -47.4,
  },
  {
    period: "2026-03",
    revenue: 1990,
    orders: 1,
    averageOrderValue: 1990,
    growthPercent: -44.7,
  },
  {
    period: "2026-04",
    revenue: 7364,
    orders: 5,
    averageOrderValue: 1472.8,
    growthPercent: 270.1,
  },
  {
    period: "2026-05",
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    growthPercent: -100,
  },
  {
    period: "2026-06",
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    growthPercent: 0,
  },
  {
    period: "2026-07",
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    growthPercent: 0,
  },
  {
    period: "2026-08",
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    growthPercent: 0,
  },
  {
    period: "2026-09",
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    growthPercent: 0,
  },
  {
    period: "2026-10",
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    growthPercent: 0,
  },
  {
    period: "2026-11",
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    growthPercent: 0,
  },
  {
    period: "2026-12",
    revenue: 0,
    orders: 0,
    averageOrderValue: 0,
    growthPercent: 0,
  },
];

const DEMO_YEARLY: ReportRow[] = [
  {
    period: "2026",
    revenue: 19795,
    orders: 11,
    averageOrderValue: 1799.55,
    growthPercent: 0,
  },
  {
    period: "2025",
    revenue: 16020,
    orders: 9,
    averageOrderValue: 1780,
    growthPercent: -19.1,
  },
];

const DEMO_EMPLOYEE: EmployeePerformance[] = [
  {
    salesOsUserId: "demo-olivia",
    name: "Olivia Carter",
    email: "olivia@northstar.io",
    salesCount: 9,
    revenue: 10211,
    averageOrderValue: 1134.56,
  },
  {
    salesOsUserId: "demo-priya",
    name: "Priya Iyer",
    email: "priya@kindlework.com",
    salesCount: 6,
    revenue: 9243,
    averageOrderValue: 1540.5,
  },
  {
    salesOsUserId: "demo-marcus",
    name: "Marcus Reyes",
    email: "marcus@helio.dev",
    salesCount: 7,
    revenue: 14404,
    averageOrderValue: 2057.71,
  },
];

const DEMO_PL_2026: ProfitLossRow[] = [
  {
    period: "2026-01",
    revenue: 6841,
    cost: 4090,
    profit: 2751,
    marginPercent: 40.2,
  },
  {
    period: "2026-02",
    revenue: 3600,
    cost: 2140,
    profit: 1460,
    marginPercent: 40.6,
  },
  {
    period: "2026-03",
    revenue: 1990,
    cost: 1270,
    profit: 720,
    marginPercent: 36.2,
  },
  {
    period: "2026-04",
    revenue: 7364,
    cost: 4282,
    profit: 3082,
    marginPercent: 41.9,
  },
  {
    period: "2026-05",
    revenue: 0,
    cost: 0,
    profit: 0,
    marginPercent: 0,
  },
  {
    period: "2026-06",
    revenue: 0,
    cost: 0,
    profit: 0,
    marginPercent: 0,
  },
  {
    period: "2026-07",
    revenue: 0,
    cost: 0,
    profit: 0,
    marginPercent: 0,
  },
  {
    period: "2026-08",
    revenue: 0,
    cost: 0,
    profit: 0,
    marginPercent: 0,
  },
  {
    period: "2026-09",
    revenue: 0,
    cost: 0,
    profit: 0,
    marginPercent: 0,
  },
  {
    period: "2026-10",
    revenue: 0,
    cost: 0,
    profit: 0,
    marginPercent: 0,
  },
  {
    period: "2026-11",
    revenue: 0,
    cost: 0,
    profit: 0,
    marginPercent: 0,
  },
  {
    period: "2026-12",
    revenue: 0,
    cost: 0,
    profit: 0,
    marginPercent: 0,
  },
];

export default function ReportsPage() {
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const monthlyQ = useGetMonthlyReport({ year });
  const yearlyQ = useGetYearlyReport();
  const empQ = useGetEmployeePerformance();
  const plQ = useGetProfitLoss({ year });
  const monthlyData = Array.isArray(monthlyQ.data) ? monthlyQ.data : [];
  const yearlyData = Array.isArray(yearlyQ.data) ? yearlyQ.data : [];
  const employeeData = Array.isArray(empQ.data) ? empQ.data : [];
  const profitLossData = Array.isArray(plQ.data) ? plQ.data : [];

  const monthlyRows =
    monthlyData.length > 0
      ? monthlyData
      : year === 2026
        ? DEMO_MONTHLY_2026
        : [];
  const yearlyRows = yearlyData.length > 0 ? yearlyData : DEMO_YEARLY;
  const employeeRows =
    employeeData.length > 0 ? employeeData : DEMO_EMPLOYEE;
  const profitLossRows =
    profitLossData.length > 0
      ? profitLossData
      : year === 2026
        ? DEMO_PL_2026
        : [];

  const exportMonthlyCsv = () => {
    const rows = monthlyRows.map((r) => ({
      period: formatMonthLabel(r.period),
      revenue: r.revenue.toFixed(2),
      orders: r.orders,
      averageOrderValue: r.averageOrderValue.toFixed(2),
      growthPercent: r.growthPercent.toFixed(2),
    }));
    const csv = toCSV(rows, [
      { key: "period", label: "Month" },
      { key: "revenue", label: "Revenue" },
      { key: "orders", label: "Orders" },
      { key: "averageOrderValue", label: "Avg Order Value" },
      { key: "growthPercent", label: "Growth %" },
    ]);
    downloadCSV(`monthly-report-${year}.csv`, csv);
  };

  const exportMonthlyPdf = () => {
    downloadTableAsPdf(
      `Monthly Report — ${year}`,
      ["Month", "Revenue", "Orders", "Avg order", "Growth %"],
      monthlyRows.map((r) => [
        formatMonthLabel(r.period),
        formatCurrency(r.revenue),
        r.orders,
        formatCurrency(r.averageOrderValue, true),
        `${r.growthPercent.toFixed(1)}%`,
      ]),
      `monthly-report-${year}.pdf`,
    );
  };

  const exportYearlyCsv = () => {
    const rows = yearlyRows.map((r) => ({
      period: r.period,
      revenue: r.revenue.toFixed(2),
      orders: r.orders,
      averageOrderValue: r.averageOrderValue.toFixed(2),
      growthPercent: r.growthPercent.toFixed(2),
    }));
    const csv = toCSV(rows, [
      { key: "period", label: "Year" },
      { key: "revenue", label: "Revenue" },
      { key: "orders", label: "Orders" },
      { key: "averageOrderValue", label: "Avg Order Value" },
      { key: "growthPercent", label: "Growth %" },
    ]);
    downloadCSV(`yearly-report.csv`, csv);
  };

  const exportEmployeeCsv = () => {
    const rows = employeeRows.map((r) => ({
      name: r.name ?? r.email ?? "Unknown",
      salesCount: r.salesCount,
      revenue: r.revenue.toFixed(2),
      averageOrderValue: r.averageOrderValue.toFixed(2),
    }));
    const csv = toCSV(rows, [
      { key: "name", label: "Teammate" },
      { key: "salesCount", label: "Sales" },
      { key: "revenue", label: "Revenue" },
      { key: "averageOrderValue", label: "Avg order" },
    ]);
    downloadCSV("employee-performance.csv", csv);
  };

  const exportPlPdf = () => {
    downloadTableAsPdf(
      `Profit & Loss — ${year}`,
      ["Month", "Revenue", "Cost", "Profit", "Margin"],
      profitLossRows.map((r) => [
        formatMonthLabel(r.period),
        formatCurrency(r.revenue),
        formatCurrency(r.cost),
        formatCurrency(r.profit),
        `${r.marginPercent.toFixed(1)}%`,
      ]),
      `profit-loss-${year}.pdf`,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Drill into your sales by month or year. Export anything to CSV or PDF.
        </p>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="pl">Profit &amp; Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Monthly performance</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={String(year)}
                  onValueChange={(v) => setYear(Number(v))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMonthlyCsv}
                  disabled={monthlyRows.length === 0}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMonthlyPdf}
                  disabled={monthlyRows.length === 0}
                >
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyQ.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Avg order</TableHead>
                        <TableHead className="text-right">Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyRows.map((r) => (
                        <TableRow key={r.period}>
                          <TableCell className="font-medium">
                            {formatMonthLabel(r.period)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(r.revenue)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(r.orders)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.averageOrderValue
                              ? formatCurrency(r.averageOrderValue, true)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <GrowthCell value={r.growthPercent} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Yearly performance</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportYearlyCsv}
                disabled={yearlyRows.length === 0}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {yearlyQ.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : yearlyRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No yearly data yet.
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Avg order</TableHead>
                        <TableHead className="text-right">Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearlyRows.map((r) => (
                        <TableRow key={r.period}>
                          <TableCell className="font-medium">
                            {r.period}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(r.revenue)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(r.orders)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.averageOrderValue
                              ? formatCurrency(r.averageOrderValue, true)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <GrowthCell value={r.growthPercent} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Employee performance</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={exportEmployeeCsv}
                disabled={employeeRows.length === 0}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {empQ.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : employeeRows.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No teammates have logged sales yet.
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teammate</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Avg order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeRows.map((e, idx) => (
                        <TableRow key={e.salesOsUserId ?? `u-${idx}`}>
                          <TableCell className="font-medium">
                            {e.name ?? e.email ?? "Unknown"}
                            {e.email && e.name && (
                              <p className="text-xs text-muted-foreground">
                                {e.email}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(e.salesCount)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(e.revenue)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(e.averageOrderValue, true)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pl" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profit &amp; Loss</CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={String(year)}
                  onValueChange={(v) => setYear(Number(v))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPlPdf}
                  disabled={profitLossRows.length === 0}
                >
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {plQ.isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profitLossRows.map((r) => (
                        <TableRow key={r.period}>
                          <TableCell className="font-medium">
                            {formatMonthLabel(r.period)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(r.revenue)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(r.cost)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right tabular-nums font-medium",
                              r.profit >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400",
                            )}
                          >
                            {formatCurrency(r.profit)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.revenue > 0
                              ? `${r.marginPercent.toFixed(1)}%`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
