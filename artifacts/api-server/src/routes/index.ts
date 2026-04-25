import { Router, type IRouter } from "express";
import healthRouter from "./health";
import salesRouter from "./sales";
import customersRouter from "./customers";
import productsRouter from "./products";
import targetsRouter from "./targets";
import notificationsRouter from "./notifications";
import activityRouter from "./activity";
import analyticsRouter from "./analytics";
import reportsRouter from "./reports";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(salesRouter);
router.use(customersRouter);
router.use(productsRouter);
router.use(targetsRouter);
router.use(notificationsRouter);
router.use(activityRouter);
router.use(analyticsRouter);
router.use(reportsRouter);
router.use(usersRouter);

export default router;
