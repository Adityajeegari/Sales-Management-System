import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import {
  db,
  salesTable,
  customersTable,
  productsTable,
  userRolesTable,
} from "@workspace/db";
import {
  ListSalesQueryParams,
  ListSalesResponse,
  CreateSaleBody,
  GetSaleParams,
  GetSaleResponse,
  UpdateSaleParams,
  UpdateSaleBody,
  UpdateSaleResponse,
  DeleteSaleParams,
  GetInvoiceDataParams,
} from "@workspace/api-zod";
import { requireRole, type AuthedRequest } from "../lib/auth";
import { serializeSale } from "../lib/serializers";
import {
  broadcastNotification,
  generateInvoiceNumber,
  logActivity,
} from "../lib/activity";

const router: IRouter = Router();

const requireViewer = requireRole("admin", "manager", "staff");
const requireEditor = requireRole("admin", "manager", "staff");
const requireDeleter = requireRole("admin", "manager");

async function fetchCustomerName(id: number | null): Promise<string | null> {
  if (!id) return null;
  const [c] = await db
    .select({ name: customersTable.name })
    .from(customersTable)
    .where(eq(customersTable.id, id));
  return c?.name ?? null;
}

async function fetchActorName(
  salesOsUserId: string | null,
): Promise<string | null> {
  if (!salesOsUserId) return null;
  const [u] = await db
    .select({ name: userRolesTable.name, email: userRolesTable.email })
    .from(userRolesTable)
    .where(eq(userRolesTable.salesOsUserId, salesOsUserId));
  return u?.name ?? u?.email ?? null;
}

router.get("/sales", requireViewer, async (req, res): Promise<void> => {
  const parsed = ListSalesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const q = parsed.data;
  const conditions = [];
  if (q.status) conditions.push(eq(salesTable.status, q.status));
  if (q.customerId)
    conditions.push(eq(salesTable.customerId, q.customerId));
  if (q.startDate) conditions.push(gte(salesTable.saleDate, q.startDate));
  if (q.endDate) conditions.push(lte(salesTable.saleDate, q.endDate));
  if (q.minPrice != null)
    conditions.push(gte(salesTable.price, String(q.minPrice)));
  if (q.maxPrice != null)
    conditions.push(lte(salesTable.price, String(q.maxPrice)));
  if (q.search) conditions.push(ilike(salesTable.productName, `%${q.search}%`));

  const rows = await db
    .select({
      sale: salesTable,
      customerName: customersTable.name,
      actorName: userRolesTable.name,
      actorEmail: userRolesTable.email,
    })
    .from(salesTable)
    .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
    .leftJoin(
      userRolesTable,
      eq(salesTable.createdBySalesOsId, userRolesTable.salesOsUserId),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(salesTable.saleDate));

  const data = rows.map((r) =>
    serializeSale(
      r.sale,
      r.customerName ?? null,
      r.actorName ?? r.actorEmail ?? null,
    ),
  );
  res.json(ListSalesResponse.parse(data));
});

router.post("/sales", requireEditor, async (req, res): Promise<void> => {
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  const auth = req as AuthedRequest;
  const subtotal = Number(body.price) * Number(body.quantity);
  const discount = Math.max(0, Number(body.discountAmount ?? 0));
  const taxableBase = Math.max(0, subtotal - discount);
  const gstPercent = Math.max(0, Number(body.gstPercent ?? 0));
  const gstAmount = Math.round(taxableBase * gstPercent) / 100;
  const total = Math.round((taxableBase + gstAmount) * 100) / 100;

  // If a product is linked, validate stock and decrement
  let productName = body.productName;
  let category = body.category;
  if (body.productId) {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, body.productId));
    if (!product) {
      res.status(400).json({ error: "Product not found" });
      return;
    }
    if (body.status !== "cancelled" && product.stock < body.quantity) {
      res.status(400).json({
        error: `Not enough stock for ${product.name}. Available: ${product.stock}`,
      });
      return;
    }
    productName = product.name;
    category = product.category;
  }

  const [sale] = await db
    .insert(salesTable)
    .values({
      productId: body.productId ?? null,
      productName,
      category,
      price: String(body.price),
      quantity: body.quantity,
      subtotal: String(subtotal),
      discountAmount: String(discount),
      gstAmount: String(gstAmount),
      total: String(total),
      paymentMethod: body.paymentMethod ?? null,
      status: body.status,
      saleDate: body.saleDate,
      customerId: body.customerId ?? null,
      createdBySalesOsId: auth.userId ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  const invoiceNumber = generateInvoiceNumber(sale.id, new Date(sale.saleDate));
  await db
    .update(salesTable)
    .set({ invoiceNumber })
    .where(eq(salesTable.id, sale.id));
  sale.invoiceNumber = invoiceNumber;

  // Decrement stock if product linked and not cancelled
  if (body.productId && body.status !== "cancelled") {
    const [updatedProduct] = await db
      .update(productsTable)
      .set({ stock: sql`${productsTable.stock} - ${body.quantity}` })
      .where(eq(productsTable.id, body.productId))
      .returning();
    if (updatedProduct.stock <= updatedProduct.lowStockThreshold) {
      await broadcastNotification({
        type: "low_stock",
        title: "Low stock after sale",
        body: `${updatedProduct.name} now has ${updatedProduct.stock} units left.`,
        metadata: { productId: updatedProduct.id, sku: updatedProduct.sku },
      });
    }
  }

  await logActivity({
    salesOsUserId: auth.userId,
    actorName: auth.userRole?.name,
    actorEmail: auth.userRole?.email,
    action: "create",
    entityType: "sale",
    entityId: sale.id,
    summary: `Recorded sale ${invoiceNumber} for ₹${total.toLocaleString("en-IN")}`,
  });
  await broadcastNotification({
    type: "new_order",
    title: "New order recorded",
    body: `${productName} × ${body.quantity} — ₹${total.toLocaleString("en-IN")}`,
    metadata: { saleId: sale.id, invoiceNumber },
  });

  const customerName = await fetchCustomerName(sale.customerId);
  const actorName = await fetchActorName(sale.createdBySalesOsId);
  res.status(201).json(
    GetSaleResponse.parse(serializeSale(sale, customerName, actorName)),
  );
});

router.get("/sales/:id", requireViewer, async (req, res): Promise<void> => {
  const params = GetSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({
      sale: salesTable,
      customerName: customersTable.name,
      actorName: userRolesTable.name,
      actorEmail: userRolesTable.email,
    })
    .from(salesTable)
    .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
    .leftJoin(
      userRolesTable,
      eq(salesTable.createdBySalesOsId, userRolesTable.salesOsUserId),
    )
    .where(eq(salesTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }
  res.json(
    GetSaleResponse.parse(
      serializeSale(
        row.sale,
        row.customerName ?? null,
        row.actorName ?? row.actorEmail ?? null,
      ),
    ),
  );
});

router.patch("/sales/:id", requireEditor, async (req, res): Promise<void> => {
  const params = UpdateSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  const subtotal = Number(body.price) * Number(body.quantity);
  const discount = Math.max(0, Number(body.discountAmount ?? 0));
  const taxableBase = Math.max(0, subtotal - discount);
  const gstPercent = Math.max(0, Number(body.gstPercent ?? 0));
  const gstAmount = Math.round(taxableBase * gstPercent) / 100;
  const total = Math.round((taxableBase + gstAmount) * 100) / 100;

  const [sale] = await db
    .update(salesTable)
    .set({
      productName: body.productName,
      category: body.category,
      price: String(body.price),
      quantity: body.quantity,
      subtotal: String(subtotal),
      discountAmount: String(discount),
      gstAmount: String(gstAmount),
      total: String(total),
      paymentMethod: body.paymentMethod ?? null,
      status: body.status,
      saleDate: body.saleDate,
      customerId: body.customerId ?? null,
      notes: body.notes ?? null,
    })
    .where(eq(salesTable.id, params.data.id))
    .returning();
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }
  const auth = req as AuthedRequest;
  await logActivity({
    salesOsUserId: auth.userId,
    actorName: auth.userRole?.name,
    actorEmail: auth.userRole?.email,
    action: "update",
    entityType: "sale",
    entityId: sale.id,
    summary: `Updated sale ${sale.invoiceNumber ?? sale.id}`,
  });
  const customerName = await fetchCustomerName(sale.customerId);
  const actorName = await fetchActorName(sale.createdBySalesOsId);
  res.json(
    UpdateSaleResponse.parse(serializeSale(sale, customerName, actorName)),
  );
});

router.delete("/sales/:id", requireDeleter, async (req, res): Promise<void> => {
  const params = DeleteSaleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [sale] = await db
    .delete(salesTable)
    .where(eq(salesTable.id, params.data.id))
    .returning();
  if (!sale) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }
  // Restock if linked product and not cancelled
  if (sale.productId && sale.status !== "cancelled") {
    await db
      .update(productsTable)
      .set({ stock: sql`${productsTable.stock} + ${sale.quantity}` })
      .where(eq(productsTable.id, sale.productId));
  }
  const auth = req as AuthedRequest;
  await logActivity({
    salesOsUserId: auth.userId,
    actorName: auth.userRole?.name,
    actorEmail: auth.userRole?.email,
    action: "delete",
    entityType: "sale",
    entityId: sale.id,
    summary: `Deleted sale ${sale.invoiceNumber ?? sale.id}`,
  });
  res.sendStatus(204);
});

router.get(
  "/sales/:id/invoice",
  requireViewer,
  async (req, res): Promise<void> => {
    const params = GetInvoiceDataParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [row] = await db
      .select({
        sale: salesTable,
        customer: customersTable,
      })
      .from(salesTable)
      .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
      .where(eq(salesTable.id, params.data.id));
    if (!row) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }
    const s = row.sale;
    const c = row.customer;
    const subtotal = Number(s.subtotal ?? s.total);
    const discount = Number(s.discountAmount ?? 0);
    const gst = Number(s.gstAmount ?? 0);
    const total = Number(s.total);
    const invoiceNumber =
      s.invoiceNumber ?? generateInvoiceNumber(s.id, new Date(s.saleDate));
    res.json({
      invoiceNumber,
      issueDate: new Date(s.saleDate).toISOString(),
      status: s.status,
      paymentMethod: s.paymentMethod ?? null,
      sellerName: "Sales OS",
      customerName: c?.name ?? null,
      customerEmail: c?.email ?? null,
      customerPhone: c?.phone ?? null,
      lines: [
        {
          description: `${s.productName} (${s.category})`,
          quantity: s.quantity,
          unitPrice: Number(s.price),
          amount: Number(s.price) * s.quantity,
        },
      ],
      subtotal,
      discountAmount: discount,
      gstAmount: gst,
      total,
      notes: s.notes ?? null,
    });
  },
);

void sql;

export default router;
