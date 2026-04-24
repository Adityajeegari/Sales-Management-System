import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";

import { useGetCustomer } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CustomerDetailPage({ id }: { id: number }) {
  const { data, isLoading, isError } = useGetCustomer(id);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customers">
            <ArrowLeft className="mr-1 h-4 w-4" />
            All customers
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : isError || !data ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Customer not found.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(data.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {data.name}
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {data.email}
                      </span>
                      {data.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          {data.phone}
                        </span>
                      )}
                      {data.company && (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {data.company}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Lifetime spend
                    </p>
                    <p className="text-2xl font-semibold tracking-tight">
                      {formatCurrency(data.totalSpent)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="text-2xl font-semibold tracking-tight">
                      {formatNumber(data.orderCount)}
                    </p>
                  </div>
                </div>
              </div>
              {data.notes && (
                <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  {data.notes}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase history</CardTitle>
            </CardHeader>
            <CardContent>
              {data.sales.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No purchases yet.
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.sales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {s.productName}
                          </TableCell>
                          <TableCell>
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                              {s.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {s.quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(s.total, true)}
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(s.saleDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
