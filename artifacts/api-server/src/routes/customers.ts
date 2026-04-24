import { Router, type IRouter } from "express";
import { desc, eq, ilike, or, sql, sum, count } from "drizzle-orm";
import { db, customersTable, salesTable } from "@workspace/db";
import {
  ListCustomersQueryParams,
  ListCustomersResponse,
  CreateCustomerBody,
  GetCustomerParams,
  GetCustomerResponse,
  UpdateCustomerParams,
  UpdateCustomerBody,
  UpdateCustomerResponse,
  DeleteCustomerParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { serializeCustomer, serializeSale } from "../lib/serializers";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/customers", async (req, res): Promise<void> => {
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const search = parsed.data.search;
  const where = search
    ? or(
        ilike(customersTable.name, `%${search}%`),
        ilike(customersTable.email, `%${search}%`),
        ilike(customersTable.company, `%${search}%`),
      )
    : undefined;

  const rows = await db
    .select({
      customer: customersTable,
      totalSpent: sum(salesTable.total).as("total_spent"),
      orderCount: count(salesTable.id).as("order_count"),
    })
    .from(customersTable)
    .leftJoin(salesTable, eq(salesTable.customerId, customersTable.id))
    .where(where)
    .groupBy(customersTable.id)
    .orderBy(desc(customersTable.createdAt));

  const data = rows.map((r) =>
    serializeCustomer(
      r.customer,
      Number(r.totalSpent ?? 0),
      Number(r.orderCount ?? 0),
    ),
  );
  res.json(ListCustomersResponse.parse(data));
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  const [customer] = await db
    .insert(customersTable)
    .values({
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      company: body.company ?? null,
      notes: body.notes ?? null,
    })
    .returning();
  res.status(201).json(serializeCustomer(customer, 0, 0));
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, params.data.id));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  const sales = await db
    .select()
    .from(salesTable)
    .where(eq(salesTable.customerId, customer.id))
    .orderBy(desc(salesTable.saleDate));

  const totalSpent = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const orderCount = sales.length;
  const customerDTO = serializeCustomer(customer, totalSpent, orderCount);
  const data = {
    ...customerDTO,
    sales: sales.map((s) => serializeSale(s, customer.name)),
  };
  res.json(GetCustomerResponse.parse(data));
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  const [customer] = await db
    .update(customersTable)
    .set({
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      company: body.company ?? null,
      notes: body.notes ?? null,
    })
    .where(eq(customersTable.id, params.data.id))
    .returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const [agg] = await db
    .select({
      totalSpent: sum(salesTable.total).as("total_spent"),
      orderCount: count(salesTable.id).as("order_count"),
    })
    .from(salesTable)
    .where(eq(salesTable.customerId, customer.id));

  res.json(
    UpdateCustomerResponse.parse(
      serializeCustomer(
        customer,
        Number(agg?.totalSpent ?? 0),
        Number(agg?.orderCount ?? 0),
      ),
    ),
  );
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [customer] = await db
    .delete(customersTable)
    .where(eq(customersTable.id, params.data.id))
    .returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.sendStatus(204);
});

void sql;

export default router;
