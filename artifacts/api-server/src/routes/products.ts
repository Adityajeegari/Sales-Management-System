import { Router, type IRouter } from "express";
import { and, asc, eq, ilike, lte, sql, type SQL } from "drizzle-orm";
import { db, productsTable, salesTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
} from "@workspace/api-zod";
import { requireRole, type AuthedRequest } from "../lib/auth";
import { serializeProduct } from "../lib/serializers";
import { broadcastNotification, logActivity } from "../lib/activity";

const router: IRouter = Router();

const requireViewer = requireRole("admin", "manager", "staff");
const requireEditor = requireRole("admin", "manager");
const requireDeleter = requireRole("admin");

router.get("/products", requireViewer, async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const q = parsed.data;
  const conditions: SQL[] = [];
  if (q.search) {
    conditions.push(
      sql`(${ilike(productsTable.name, `%${q.search}%`)} OR ${ilike(
        productsTable.sku,
        `%${q.search}%`,
      )})`,
    );
  }
  if (q.category) conditions.push(eq(productsTable.category, q.category));
  if (q.lowStockOnly)
    conditions.push(lte(productsTable.stock, productsTable.lowStockThreshold));

  const rows = await db
    .select()
    .from(productsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(productsTable.name));
  res.json(rows.map(serializeProduct));
});

router.post("/products", requireEditor, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  try {
    const [p] = await db
      .insert(productsTable)
      .values({
        name: body.name,
        sku: body.sku,
        category: body.category,
        description: body.description ?? null,
        price: String(body.price),
        costPrice: String(body.costPrice),
        stock: body.stock,
        lowStockThreshold: body.lowStockThreshold,
      })
      .returning();
    const auth = req as AuthedRequest;
    await logActivity({
      salesOsUserId: auth.userId,
      actorName: auth.userRole?.name,
      actorEmail: auth.userRole?.email,
      action: "create",
      entityType: "product",
      entityId: p.id,
      summary: `Added product ${p.name} (${p.sku})`,
    });
    res.status(201).json(serializeProduct(p));
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error
          ? err.message.includes("unique")
            ? "SKU already exists"
            : err.message
          : "Could not create product",
    });
  }
});

router.get("/products/:id", requireViewer, async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [p] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));
  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(serializeProduct(p));
});

router.patch("/products/:id", requireEditor, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  const [p] = await db
    .update(productsTable)
    .set({
      name: body.name,
      sku: body.sku,
      category: body.category,
      description: body.description ?? null,
      price: String(body.price),
      costPrice: String(body.costPrice),
      stock: body.stock,
      lowStockThreshold: body.lowStockThreshold,
    })
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!p) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const auth = req as AuthedRequest;
  await logActivity({
    salesOsUserId: auth.userId,
    actorName: auth.userRole?.name,
    actorEmail: auth.userRole?.email,
    action: "update",
    entityType: "product",
    entityId: p.id,
    summary: `Updated product ${p.name}`,
  });
  if (p.stock <= p.lowStockThreshold) {
    await broadcastNotification({
      type: "low_stock",
      title: "Low stock alert",
      body: `${p.name} has only ${p.stock} units left.`,
      metadata: { productId: p.id, sku: p.sku },
    });
  }
  res.json(serializeProduct(p));
});

router.delete(
  "/products/:id",
  requireDeleter,
  async (req, res): Promise<void> => {
    const params = DeleteProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [p] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, params.data.id))
      .returning();
    if (!p) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const auth = req as AuthedRequest;
    await logActivity({
      salesOsUserId: auth.userId,
      actorName: auth.userRole?.name,
      actorEmail: auth.userRole?.email,
      action: "delete",
      entityType: "product",
      entityId: p.id,
      summary: `Deleted product ${p.name}`,
    });
    res.sendStatus(204);
  },
);

void salesTable;

export default router;
