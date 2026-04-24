import { Router, type IRouter } from "express";
import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { db, salesTable, customersTable } from "@workspace/db";
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
} from "@workspace/api-zod";
import { requireRole } from "../lib/auth";
import { serializeSale } from "../lib/serializers";

const router: IRouter = Router();

const requireViewer = requireRole("admin", "manager", "staff");
const requireEditor = requireRole("admin", "manager", "staff");
const requireDeleter = requireRole("admin", "manager");

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
    })
    .from(salesTable)
    .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(salesTable.saleDate));

  const data = rows.map((r) => serializeSale(r.sale, r.customerName ?? null));
  res.json(ListSalesResponse.parse(data));
});

router.post("/sales", requireEditor, async (req, res): Promise<void> => {
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  const total = body.price * body.quantity;
  const [sale] = await db
    .insert(salesTable)
    .values({
      productName: body.productName,
      category: body.category,
      price: String(body.price),
      quantity: body.quantity,
      total: String(total),
      status: body.status,
      saleDate: body.saleDate,
      customerId: body.customerId ?? null,
      notes: body.notes ?? null,
    })
    .returning();

  let customerName: string | null = null;
  if (sale.customerId) {
    const [c] = await db
      .select({ name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, sale.customerId));
    customerName = c?.name ?? null;
  }
  res.status(201).json(GetSaleResponse.parse(serializeSale(sale, customerName)));
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
    })
    .from(salesTable)
    .leftJoin(customersTable, eq(salesTable.customerId, customersTable.id))
    .where(eq(salesTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Sale not found" });
    return;
  }
  res.json(GetSaleResponse.parse(serializeSale(row.sale, row.customerName ?? null)));
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
  const total = body.price * body.quantity;
  const [sale] = await db
    .update(salesTable)
    .set({
      productName: body.productName,
      category: body.category,
      price: String(body.price),
      quantity: body.quantity,
      total: String(total),
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
  let customerName: string | null = null;
  if (sale.customerId) {
    const [c] = await db
      .select({ name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, sale.customerId));
    customerName = c?.name ?? null;
  }
  res.json(UpdateSaleResponse.parse(serializeSale(sale, customerName)));
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
  res.sendStatus(204);
});

// Force tree-shake unused sql import warning
void sql;

export default router;
