import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, activityLogsTable } from "@workspace/db";
import { ListActivityQueryParams } from "@workspace/api-zod";
import { requireRole } from "../lib/auth";

const router: IRouter = Router();

router.get("/activity", requireRole("admin"), async (req, res) => {
  const parsed = ListActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 100;
  const rows = await db
    .select()
    .from(activityLogsTable)
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(limit);
  res.json(
    rows.map((r) => ({
      id: r.id,
      actorName: r.actorName ?? null,
      actorEmail: r.actorEmail ?? null,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId ?? null,
      summary: r.summary,
      createdAt: new Date(r.createdAt).toISOString(),
    })),
  );
});

export default router;
