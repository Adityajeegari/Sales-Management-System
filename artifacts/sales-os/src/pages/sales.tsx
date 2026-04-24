import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Filter, X } from "lucide-react";
import { toast } from "sonner";

import {
  useListSales,
  useCreateSale,
  useUpdateSale,
  useDeleteSale,
  useListCustomers,
  getListSalesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetSalesTrendQueryKey,
  getGetCategoryDistributionQueryKey,
  getGetTopProductsQueryKey,
  getGetRecentSalesQueryKey,
  getGetSalesForecastQueryKey,
  type Sale,
  type SaleInput,
} from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { formatCurrency, formatDate } from "@/lib/format";
import { useCurrentUserRole } from "@/lib/roles";

const STATUS_OPTIONS: SaleInput["status"][] = [
  "pending",
  "completed",
  "cancelled",
];

function todayISO(): string {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function invalidateAllSalesData(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: getListSalesQueryKey() });
  qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  qc.invalidateQueries({ queryKey: getGetSalesTrendQueryKey() });
  qc.invalidateQueries({ queryKey: getGetCategoryDistributionQueryKey() });
  qc.invalidateQueries({ queryKey: getGetTopProductsQueryKey() });
  qc.invalidateQueries({ queryKey: getGetRecentSalesQueryKey() });
  qc.invalidateQueries({ queryKey: getGetSalesForecastQueryKey() });
}

function SaleDialog({
  open,
  onOpenChange,
  sale,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sale: Sale | null;
}) {
  const qc = useQueryClient();
  const customersQ = useListCustomers();
  const createMut = useCreateSale();
  const updateMut = useUpdateSale();

  const [productName, setProductName] = useState(sale?.productName ?? "");
  const [category, setCategory] = useState(sale?.category ?? "");
  const [price, setPrice] = useState<string>(sale ? String(sale.price) : "");
  const [quantity, setQuantity] = useState<string>(
    sale ? String(sale.quantity) : "1",
  );
  const [status, setStatus] = useState<SaleInput["status"]>(
    sale?.status ?? "completed",
  );
  const [saleDate, setSaleDate] = useState<string>(
    sale ? new Date(sale.saleDate).toISOString().slice(0, 10) : todayISO(),
  );
  const [customerId, setCustomerId] = useState<string>(
    sale?.customerId ? String(sale.customerId) : "none",
  );
  const [notes, setNotes] = useState(sale?.notes ?? "");

  const isEdit = !!sale;
  const submitting = createMut.isPending || updateMut.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: SaleInput = {
      productName: productName.trim(),
      category: category.trim(),
      price: Number(price),
      quantity: Number(quantity),
      status,
      saleDate,
      customerId: customerId === "none" ? null : Number(customerId),
      notes: notes.trim() ? notes.trim() : null,
    };

    try {
      if (isEdit && sale) {
        await updateMut.mutateAsync({ id: sale.id, data: body });
        toast.success("Sale updated");
      } else {
        await createMut.mutateAsync({ data: body });
        toast.success("Sale created");
      }
      invalidateAllSalesData(qc);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save sale");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit sale" : "New sale"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this sale."
              : "Log a new sale to your records."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="productName">Product</Label>
            <Input
              id="productName"
              value={productName}
              required
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Pro Subscription"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                required
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Software"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as SaleInput["status"])}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="price">Unit price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                required
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                min="1"
                value={quantity}
                required
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="saleDate">Sale date</Label>
              <Input
                id="saleDate"
                type="date"
                value={saleDate}
                required
                onChange={(e) => setSaleDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="No customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Walk-in / none</SelectItem>
                  {(customersQ.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional details about this sale"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Total:{" "}
            <span className="font-medium text-foreground">
              {formatCurrency(
                Number(price || 0) * Number(quantity || 0),
                true,
              )}
            </span>
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Create sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SalesPage() {
  const qc = useQueryClient();
  const { canDeleteSales } = useCurrentUserRole();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState<Sale | null>(null);

  const params = useMemo(
    () => ({
      search: search || undefined,
      status:
        statusFilter === "all"
          ? undefined
          : (statusFilter as SaleInput["status"]),
    }),
    [search, statusFilter],
  );

  const { data: sales, isLoading } = useListSales(params);
  const deleteMut = useDeleteSale();

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMut.mutateAsync({ id: deleting.id });
      toast.success("Sale deleted");
      invalidateAllSalesData(qc);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete sale");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Sales
          </h1>
          <p className="text-sm text-muted-foreground">
            Every order, in one place.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New sale
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || statusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (sales ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No sales match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  (sales ?? []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.productName}
                      </TableCell>
                      <TableCell>{s.customerName ?? "Walk-in"}</TableCell>
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(s);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {canDeleteSales && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(s)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {dialogOpen && (
        <SaleDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          sale={editing}
        />
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.productName} for{" "}
              {formatCurrency(deleting?.total ?? 0, true)} will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
