import { Router, type IRouter } from "express";
import healthRouter from "./health";
import salesRouter from "./sales";
import customersRouter from "./customers";
import analyticsRouter from "./analytics";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(salesRouter);
router.use(customersRouter);
router.use(analyticsRouter);
router.use(reportsRouter);

export default router;
