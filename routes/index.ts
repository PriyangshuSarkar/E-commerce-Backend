import { Router } from "express";
import authRoutes from "./user";
import productRoutes from "./product";
import addressRoutes from "./address";

const rootRouter: Router = Router();

rootRouter.use("/user", authRoutes);

rootRouter.use("/product", productRoutes);

rootRouter.use("/address", addressRoutes);

export default rootRouter;
