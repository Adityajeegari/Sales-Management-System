import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Filter,
  X,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

import {
  useListSales,
  useCreateSale,
  useUpdateSale,
  useDeleteSale,
  useListCustomers,
  useListProducts,
  getListSalesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetSalesTrendQueryKey,
  getGetCategoryDistributionQueryKey,
  getGetTopProductsQueryKey,
  getGetRecentSalesQueryKey,
  getGetSalesForecastQueryKey,
  getListProductsQueryKey,
  getGetCurrentTargetQueryKey,
  getListNotificationsQueryKey,
  getInvoiceData,
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

import { formatCurrency } from "@/lib/format";
import { useCurrentUserRole } from "@/lib/roles";
import { downloadInvoicePdf } from "@/lib/pdf";

const STATUS_OPTIONS: SaleInput["status"][] = [
  "pending",
  "completed",
  "cancelled",
];

const PAYMENT_OPTIONS: NonNullable<SaleInput["paymentMethod"]>[] = [
  "cash",
  "upi",
  "card",
  "bank_transfer",
];

function makeDemoSale(overrides: Partial<Sale> & { id: number; productName: string; category: string; saleDate: string; total: number; quantity: number; status: Sale["status"] }): Sale {
  const price = overrides.price ?? Math.round((overrides.total / Math.max(1, overrides.quantity)) * 100) / 100;
  const subtotal = overrides.subtotal ?? overrides.total;
  return {
    id: overrides.id,
    invoiceNumber: overrides.invoiceNumber ?? null,
    productId: overrides.productId ?? null,
    productName: overrides.productName,
    category: overrides.category,
    price,
    quantity: overrides.quantity,
    subtotal,
    discountAmount: overrides.discountAmount ?? 0,
    gstAmount: overrides.gstAmount ?? 0,
    total: overrides.total,
    paymentMethod: overrides.paymentMethod ?? null,
    status: overrides.status,
    saleDate: overrides.saleDate,
    customerId: overrides.customerId ?? null,
    customerName: overrides.customerName ?? null,
    createdBySalesOsId: overrides.createdBySalesOsId ?? null,
    createdByName: overrides.createdByName ?? null,
    notes: overrides.notes ?? null,
    createdAt: overrides.createdAt ?? overrides.saleDate,
    updatedAt: overrides.updatedAt ?? overrides.saleDate,
  };
}

const DEMO_SALES: Sale[] = [
  makeDemoSale({ id: 24, productName: "Pro Subscription", category: "Software", customerName: "Marcus Reyes", quantity: 2, total: 398, status: "pending", saleDate: "2026-04-23T00:00:00.000Z" }),
  makeDemoSale({ id: 23, productName: "Custom Integration", category: "Services", customerName: "Priya Iyer", quantity: 1, total: 2400, status: "pending", saleDate: "2026-04-21T00:00:00.000Z" }),
  makeDemoSale({ id: 22, productName: "Hardware Bundle", category: "Hardware", customerName: "Olivia Carter", quantity: 1, total: 1250, status: "cancelled", saleDate: "2026-04-19T00:00:00.000Z" }),
  makeDemoSale({ id: 19, productName: "Analytics Add-on", category: "Software", customerName: "Marcus Reyes", quantity: 6, total: 474, status: "completed", saleDate: "2026-04-13T00:00:00.000Z" }),
  makeDemoSale({ id: 18, productName: "Pro Subscription", category: "Software", customerName: "Olivia Carter", quantity: 8, total: 1592, status: "completed", saleDate: "2026-04-12T00:00:00.000Z" }),
  makeDemoSale({ id: 17, productName: "Hardware Bundle", category: "Hardware", customerName: "Priya Iyer", quantity: 2, total: 2500, status: "completed", saleDate: "2026-04-05T00:00:00.000Z" }),
  makeDemoSale({ id: 16, productName: "Pro Subscription", category: "Software", customerName: "Olivia Carter", quantity: 10, total: 1990, status: "completed", saleDate: "2026-03-24T00:00:00.000Z" }),
  makeDemoSale({ id: 15, productName: "Premium Support", category: "Services", customerName: "Olivia Carter", quantity: 2, total: 1200, status: "completed", saleDate: "2026-02-28T00:00:00.000Z" }),
  makeDemoSale({ id: 14, productName: "Custom Integration", category: "Services", customerName: "Marcus Reyes", quantity: 1, total: 2400, status: "completed", saleDate: "2026-02-24T00:00:00.000Z" }),
  makeDemoSale({ id: 13, productName: "Analytics Add-on", category: "Software", customerName: "Priya Iyer", quantity: 12, total: 948, status: "completed", saleDate: "2026-01-31T00:00:00.000Z" }),
  makeDemoSale({ id: 12, productName: "Pro Subscription", category: "Software", customerName: "Olivia Carter", quantity: 7, total: 1393, status: "completed", saleDate: "2026-01-24T00:00:00.000Z" }),
  makeDemoSale({ id: 11, productName: "Enterprise License", category: "Software", customerName: "Marcus Reyes", quantity: 1, total: 4500, status: "completed", saleDate: "2026-01-05T00:00:00.000Z" }),
  makeDemoSale({ id: 10, productName: "Premium Support", category: "Services", customerName: "Priya Iyer", quantity: 1, total: 600, status: "completed", saleDate: "2025-12-24T00:00:00.000Z" }),
  makeDemoSale({ id: 9, productName: "Analytics Add-on", category: "Software", customerName: "Marcus Reyes", quantity: 8, total: 632, status: "completed", saleDate: "2025-12-02T00:00:00.000Z" }),
  makeDemoSale({ id: 8, productName: "Pro Subscription", category: "Software", customerName: "Olivia Carter", quantity: 6, total: 1194, status: "completed", saleDate: "2025-11-24T00:00:00.000Z" }),
  makeDemoSale({ id: 7, productName: "Custom Integration", category: "Services", customerName: "Priya Iyer", quantity: 1, total: 2400, status: "completed", saleDate: "2025-11-03T00:00:00.000Z" }),
  makeDemoSale({ id: 6, productName: "Pro Subscription", category: "Software", customerName: "Olivia Carter", quantity: 4, total: 796, status: "completed", saleDate: "2025-09-24T00:00:00.000Z" }),
  makeDemoSale({ id: 4, productName: "Analytics Add-on", category: "Software", customerName: "Priya Iyer", quantity: 5, total: 395, status: "completed", saleDate: "2025-09-05T00:00:00.000Z" }),
  makeDemoSale({ id: 3, productName: "Enterprise License", category: "Software", customerName: "Marcus Reyes", quantity: 1, total: 4500, status: "completed", saleDate: "2025-08-24T00:00:00.000Z" }),
  makeDemoSale({ id: 2, productName: "Pro Subscription", category: "Software", customerName: "Olivia Carter", quantity: 3, total: 597, status: "completed", saleDate: "2025-07-24T00:00:00.000Z" }),
  makeDemoSale({ id: 2_1, productName: "Team Onboarding", category: "Services", customerName: "Marcus Reyes", quantity: 1, total: 1500, status: "completed", saleDate: "2025-06-26T00:00:00.000Z" }),
  makeDemoSale({ id: 1, productName: "Pro Subscription", category: "Software", customerName: "Olivia Carter", quantity: 1, total: 199, status: "completed", saleDate: "2025-05-29T00:00:00.000Z" }),
];

function todayISO(): string {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

function formatSalesDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function invalidateAllSalesData(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: getListSalesQueryKey() });
  qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  qc.invalidateQueries({ queryKey: getGetSalesTrendQueryKey() });
  qc.invalidateQueries({ queryKey: getGetCategoryDistributionQueryKey() });
  qc.invalidateQueries({ queryKey: getGetTopProductsQueryKey() });
  qc.invalidateQueries({ queryKey: getGetRecentSalesQueryKey() });
  qc.invalidateQueries({ queryKey: getGetSalesForecastQueryKey() });
  qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
  qc.invalidateQueries({ queryKey: getGetCurrentTargetQueryKey() });
  qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
}

function SaleDialog({
  open,
  onOpenChange,
  sale,
  demoMode,
  onDemoSalesChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sale: Sale | null;
  demoMode: boolean;
  onDemoSalesChange: React.Dispatch<React.SetStateAction<Sale[]>>;
}) {
  const qc = useQueryClient();
  const customersQ = useListCustomers();
  const productsQ = useListProducts();
  const createMut = useCreateSale();
  const updateMut = useUpdateSale();
  const products = Array.isArray(productsQ.data) ? productsQ.data : [];
  const customers = Array.isArray(customersQ.data) ? customersQ.data : [];

  const [productId, setProductId] = useState<string>(
    sale?.productId ? String(sale.productId) : "manual",
  );
  const [productName, setProductName] = useState(sale?.productName ?? "");
  const [category, setCategory] = useState(sale?.category ?? "");
  const [price, setPrice] = useState<string>(sale ? String(sale.price) : "");
  const [quantity, setQuantity] = useState<string>(
    sale ? String(sale.quantity) : "1",
  );
  const [discount, setDiscount] = useState<string>(
    sale ? String(sale.discountAmount ?? 0) : "0",
  );
  const [gstPercent, setGstPercent] = useState<string>(
    sale && sale.subtotal
      ? String(
          Math.round(
            ((sale.gstAmount ?? 0) /
              Math.max(1, sale.subtotal - (sale.discountAmount ?? 0))) *
              10000,
          ) / 100,
        )
      : "18",
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    sale?.paymentMethod ?? "cash",
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

  // Auto-fill from product
  useEffect(() => {
    if (productId === "manual") return;
    const p = products.find((pr) => String(pr.id) === productId);
    if (p) {
      setProductName(p.name);
      setCategory(p.category);
      setPrice(String(p.price));
    }
  }, [productId, products]);

  const subtotal = Number(price || 0) * Number(quantity || 0);
  const discountNum = Math.max(0, Number(discount || 0));
  const taxableBase = Math.max(0, subtotal - discountNum);
  const gstNum = (taxableBase * Number(gstPercent || 0)) / 100;
  const total = taxableBase + gstNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: SaleInput = {
      productId: productId === "manual" ? null : Number(productId),
      productName: productName.trim(),
      category: category.trim(),
      price: Number(price),
      quantity: Number(quantity),
      discountAmount: discountNum,
      gstPercent: Number(gstPercent || 0),
      paymentMethod: paymentMethod as SaleInput["paymentMethod"],
      status,
      saleDate,
      customerId: customerId === "none" ? null : Number(customerId),
      notes: notes.trim() ? notes.trim() : null,
    };

    try {
      if (demoMode) {
        const nextSale: Sale = {
          id: sale?.id ?? Date.now(),
          invoiceNumber: sale?.invoiceNumber ?? null,
          productId: body.productId,
          productName: body.productName,
          category: body.category,
          price: body.price,
          quantity: body.quantity,
          subtotal,
          discountAmount: discountNum,
          gstAmount: gstNum,
          total,
          paymentMethod: body.paymentMethod,
          status: body.status,
          saleDate: new Date(body.saleDate).toISOString(),
          customerId: body.customerId,
          customerName:
            customers.find((customer) => customer.id === body.customerId)
              ?.name ?? sale?.customerName ?? null,
          createdBySalesOsId: sale?.createdBySalesOsId ?? null,
          createdByName: sale?.createdByName ?? null,
          notes: body.notes,
          createdAt: sale?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        onDemoSalesChange((current) =>
          sale
            ? current.map((item) => (item.id === sale.id ? nextSale : item))
            : [nextSale, ...current],
        );
        toast.success(sale ? "Sale updated locally" : "Sale created locally");
        onOpenChange(false);
        return;
      }

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit sale" : "New sale"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this sale."
              : "Log a new sale. Pick a catalog product to auto-deduct stock."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Catalog product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Custom (no inventory)</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} — {formatCurrency(p.price, true)} ({p.stock} in
                    stock)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="productName">Product name</Label>
              <Input
                id="productName"
                value={productName}
                required
                onChange={(e) => setProductName(e.target.value)}
                disabled={productId !== "manual"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                required
                onChange={(e) => setCategory(e.target.value)}
                disabled={productId !== "manual"}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="price">Unit price (₹)</Label>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="discount">Discount (₹)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gst">GST (%)</Label>
              <Input
                id="gst"
                type="number"
                step="0.01"
                min="0"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Payment method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {customers.map((c) => (
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
              rows={2}
            />
          </div>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, true)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span>- {formatCurrency(discountNum, true)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST</span>
              <span>{formatCurrency(gstNum, true)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total, true)}</span>
            </div>
          </div>
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
  const [demoSales, setDemoSales] = useState<Sale[]>(() =>
    DEMO_SALES.map((sale) => ({ ...sale })),
  );

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
  const apiSales = Array.isArray(sales) ? sales : [];
  const demoMode = !isLoading && apiSales.length === 0;
  const baseSales = apiSales.length > 0 ? apiSales : demoSales;
  const query = search.trim().toLowerCase();
  const salesList = baseSales.filter((s) => {
    const statusOk = statusFilter === "all" || s.status === statusFilter;
    if (!statusOk) return false;
    if (!query) return true;
    const haystack = [
      s.productName,
      s.category,
      s.customerName ?? "",
      s.invoiceNumber ?? `#${s.id}`,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      if (demoMode) {
        setDemoSales((current) => current.filter((sale) => sale.id !== deleting.id));
        toast.success("Sale deleted locally");
        return;
      }

      await deleteMut.mutateAsync({ id: deleting.id });
      toast.success("Sale deleted");
      invalidateAllSalesData(qc);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete sale");
    } finally {
      setDeleting(null);
    }
  };

  const handleInvoice = async (id: number) => {
    try {
      const inv = await getInvoiceData(id);
      downloadInvoicePdf(inv);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not download invoice",
      );
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
            Every order, with billing, GST, and invoices.
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
                  <TableHead>Invoice</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && apiSales.length === 0 ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : salesList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No sales match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  salesList.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">
                        {s.invoiceNumber ?? `#${s.id}`}
                      </TableCell>
                      <TableCell className="font-medium">
                        {s.productName}
                        <p className="text-xs text-muted-foreground">
                          {s.category}
                        </p>
                      </TableCell>
                      <TableCell>{s.customerName ?? "Walk-in"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.quantity}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(s.total, true)}
                      </TableCell>
                      <TableCell className="text-xs capitalize text-muted-foreground">
                        {s.paymentMethod?.replace("_", " ") ?? "—"}
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
                        {formatSalesDate(s.saleDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Invoice"
                          onClick={() => handleInvoice(s.id)}
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </Button>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(s)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
          demoMode={demoMode}
          onDemoSalesChange={setDemoSales}
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
              removed. Stock will be restored if linked to a product.
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
