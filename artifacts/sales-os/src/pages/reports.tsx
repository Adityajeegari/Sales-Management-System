import { useState } from "react";
import { Download, ArrowDownRight, ArrowUpRight } from "lucide-react";

import {
  useGetMonthlyReport,
  useGetYearlyReport,
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

export default function ReportsPage() {
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const monthlyQ = useGetMonthlyReport({ year });
  const yearlyQ = useGetYearlyReport();

  const exportMonthly = () => {
    const rows = (monthlyQ.data ?? []).map((r) => ({
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

  const exportYearly = () => {
    const rows = (yearlyQ.data ?? []).map((r) => ({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Drill into your sales by month or year. Export anything to CSV.
        </p>
      </div>

      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Monthly performance</CardTitle>
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
                  onClick={exportMonthly}
                  disabled={!monthlyQ.data}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Export CSV
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
                      {(monthlyQ.data ?? []).map((r) => (
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
                onClick={exportYearly}
                disabled={!yearlyQ.data}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {yearlyQ.isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (yearlyQ.data ?? []).length === 0 ? (
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
                      {(yearlyQ.data ?? []).map((r) => (
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
      </Tabs>
    </div>
  );
}
