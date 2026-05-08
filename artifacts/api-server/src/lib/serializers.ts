import type { Sale, Customer, Product } from "@workspace/db";

export interface SaleDTO {
  id: number;
  invoiceNumber: string | null;
  productId: number | null;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  gstAmount: number;
  total: number;
  paymentMethod: "cash" | "upi" | "card" | "bank_transfer" | null;
  status: "pending" | "completed" | "cancelled";
  saleDate: string;
  customerId: number | null;
  customerName: string | null;
  createdBySalesOsId: string | null;
  createdByName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeSale(
  sale: Sale,
  customerName: string | null = null,
  createdByName: string | null = null,
): SaleDTO {
  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber ?? null,
    productId: sale.productId ?? null,
    productName: sale.productName,
    category: sale.category,
    price: Number(sale.price),
    quantity: sale.quantity,
    subtotal: Number(sale.subtotal ?? 0),
    discountAmount: Number(sale.discountAmount ?? 0),
    gstAmount: Number(sale.gstAmount ?? 0),
    total: Number(sale.total),
    paymentMethod: (sale.paymentMethod as SaleDTO["paymentMethod"]) ?? null,
    status: sale.status as SaleDTO["status"],
    saleDate: new Date(sale.saleDate).toISOString(),
    customerId: sale.customerId ?? null,
    customerName: customerName,
    createdBySalesOsId: sale.createdBySalesOsId ?? null,
    createdByName: createdByName,
    notes: sale.notes ?? null,
    createdAt: new Date(sale.createdAt).toISOString(),
    updatedAt: new Date(sale.updatedAt).toISOString(),
  };
}

export type CustomerSegment = "vip" | "regular" | "new";

export function deriveSegment(totalSpent: number, orderCount: number): CustomerSegment {
  if (totalSpent >= 5000 || orderCount >= 8) return "vip";
  if (orderCount === 0) return "new";
  return "regular";
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
  segment: CustomerSegment;
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
    segment: deriveSegment(Number(totalSpent), Number(orderCount)),
    createdAt: new Date(customer.createdAt).toISOString(),
    updatedAt: new Date(customer.updatedAt).toISOString(),
  };
}

export interface ProductDTO {
  id: number;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  price: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export function serializeProduct(p: Product): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    description: p.description ?? null,
    price: Number(p.price),
    costPrice: Number(p.costPrice),
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    lowStock: p.stock <= p.lowStockThreshold,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
  };
}
