import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
  type Product,
} from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatCurrency, formatNumber } from "@/lib/format";
import { useCurrentUserRole } from "@/lib/roles";

const ProductFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
});
type FormValues = z.infer<typeof ProductFormSchema>;

const CATEGORY_OPTIONS = [
  "Electronics",
  "Office",
  "Stationery",
  "Accessories",
  "Apparel",
  "Other",
];

function ProductDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSaved: () => void;
}) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const isEditing = product !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(ProductFormSchema),
    values: product
      ? {
          name: product.name,
          sku: product.sku,
          category: product.category,
          description: product.description ?? "",
          price: product.price,
          costPrice: product.costPrice,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
        }
      : {
          name: "",
          sku: "",
          category: "Electronics",
          description: "",
          price: 0,
          costPrice: 0,
          stock: 0,
          lowStockThreshold: 10,
        },
  });

  const submit = async (values: FormValues) => {
    try {
      if (isEditing && product) {
        await update.mutateAsync({
          id: product.id,
          data: { ...values, description: values.description || null },
        });
      } else {
        await create.mutateAsync({
          data: { ...values, description: values.description || null },
        });
      }
      toast.success(isEditing ? "Product updated" : "Product added");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit product" : "New product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...form.register("sku")} />
              {form.formState.errors.sku && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.sku.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(v) => form.setValue("category", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...form.register("price")}
              />
            </div>
            <div>
              <Label htmlFor="costPrice">Cost (₹)</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                {...form.register("costPrice")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="stock">In stock</Label>
              <Input id="stock" type="number" {...form.register("stock")} />
            </div>
            <div>
              <Label htmlFor="lowStockThreshold">Low-stock threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                {...form.register("lowStockThreshold")}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              {...form.register("description")}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEditing ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductsPage() {
  const qc = useQueryClient();
  const { canManageCustomers, isAdmin } = useCurrentUserRole();
  const canManage = canManageCustomers;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const params = useMemo(
    () => ({
      search: search || undefined,
      category: category === "all" ? undefined : category,
      lowStockOnly: lowOnly || undefined,
    }),
    [search, category, lowOnly],
  );
  const { data, isLoading } = useListProducts(params);
  const deleteMut = useDeleteProduct();

  const lowStockCount = (data ?? []).filter((p) => p.lowStock).length;
  const totalStockValue = (data ?? []).reduce(
    (acc, p) => acc + p.stock * p.costPrice,
    0,
  );

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMut.mutateAsync({ id: deleting.id });
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: getListProductsQueryKey() });
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const refresh = () =>
    qc.invalidateQueries({ queryKey: getListProductsQueryKey() });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Products & inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            Track stock, pricing, and low-stock alerts.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            New product
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Catalog size
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatNumber(data?.length ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Inventory value (cost)
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(totalStockValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Low-stock items
            </p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : ""
              }`}
            >
              {formatNumber(lowStockCount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU"
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={lowOnly ? "default" : "outline"}
              onClick={() => setLowOnly((v) => !v)}
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              Low stock only
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No products yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (data ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {p.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.sku}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(p.price, true)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(p.stock)}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.lowStock ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 text-amber-600 dark:text-amber-400"
                          >
                            Low
                          </Badge>
                        ) : (
                          <Badge variant="secondary">In stock</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(p);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(p)}
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

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        onSaved={refresh}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} will be permanently removed from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
