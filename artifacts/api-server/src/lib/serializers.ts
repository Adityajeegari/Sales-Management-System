import type { Sale, Customer } from "@workspace/db";

export interface SaleDTO {
  id: number;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  total: number;
  status: "pending" | "completed" | "cancelled";
  saleDate: string;
  customerId: number | null;
  customerName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeSale(
  sale: Sale,
  customerName: string | null = null,
): SaleDTO {
  return {
    id: sale.id,
    productName: sale.productName,
    category: sale.category,
    price: Number(sale.price),
    quantity: sale.quantity,
    total: Number(sale.total),
    status: sale.status as SaleDTO["status"],
    saleDate: new Date(sale.saleDate).toISOString(),
    customerId: sale.customerId ?? null,
    customerName: customerName,
    notes: sale.notes ?? null,
    createdAt: new Date(sale.createdAt).toISOString(),
    updatedAt: new Date(sale.updatedAt).toISOString(),
  };
}

export interface CustomerDTO {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  notes: string | null;
  totalSpent: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export function serializeCustomer(
  customer: Customer,
  totalSpent = 0,
  orderCount = 0,
): CustomerDTO {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone ?? null,
    company: customer.company ?? null,
    notes: customer.notes ?? null,
    totalSpent: Number(totalSpent),
    orderCount: Number(orderCount),
    createdAt: new Date(customer.createdAt).toISOString(),
    updatedAt: new Date(customer.updatedAt).toISOString(),
  };
}
