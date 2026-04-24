import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import {
  useListCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  getListCustomersQueryKey,
  type Customer,
  type CustomerInput,
} from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

import { formatCurrency, formatNumber } from "@/lib/format";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CustomerDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: Customer | null;
}) {
  const qc = useQueryClient();
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();

  const [name, setName] = useState(customer?.name ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [company, setCompany] = useState(customer?.company ?? "");
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const isEdit = !!customer;
  const submitting = createMut.isPending || updateMut.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: CustomerInput = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      company: company.trim() || null,
      notes: notes.trim() || null,
    };
    try {
      if (isEdit && customer) {
        await updateMut.mutateAsync({ id: customer.id, data: body });
        toast.success("Customer updated");
      } else {
        await createMut.mutateAsync({ data: body });
        toast.success("Customer added");
      }
      qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save customer",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit customer" : "New customer"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this customer's information."
              : "Add a customer to your contact list."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="cname">Full name</Label>
            <Input
              id="cname"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Rivera"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cemail">Email</Label>
            <Input
              id="cemail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@acme.com"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="cphone">Phone</Label>
              <Input
                id="cphone"
                value={phone ?? ""}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ccompany">Company</Label>
              <Input
                id="ccompany"
                value={company ?? ""}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cnotes">Notes</Label>
            <Textarea
              id="cnotes"
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything important to remember"
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
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const { data: customers, isLoading } = useListCustomers({
    search: search || undefined,
  });
  const deleteMut = useDeleteCustomer();

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMut.mutateAsync({ id: deleting.id });
      toast.success("Customer deleted");
      qc.invalidateQueries({ queryKey: getListCustomersQueryKey() });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete customer",
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Customers
          </h1>
          <p className="text-sm text-muted-foreground">
            Every account you've worked with.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          New customer
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Lifetime spend</TableHead>
                  <TableHead className="w-[140px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (customers ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-sm text-muted-foreground"
                    >
                      No customers yet. Add your first one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  (customers ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(c.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.company ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(c.orderCount)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(c.totalSpent)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/customers/${c.id}`}>
                            View
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(c);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(c)}
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
        <CustomerDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customer={editing}
        />
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name} will be removed. Their sales history will be kept
              but unlinked.
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
