import { Router } from "express";
import authRoutes from "./auth";
import productRoutes from "./product";

const rootRouter: Router = Router();

rootRouter.use("/auth", authRoutes);

rootRouter.use("/product", productRoutes);

export default rootRouter;
