import { Router } from "express";
import authRoutes from "./user";
import productRoutes from "./product";
import addressRoutes from "./address";
import cartRouter from "./cart";

const rootRouter: Router = Router();

rootRouter.use("/user", authRoutes);

rootRouter.use("/product", productRoutes);

rootRouter.use("/address", addressRoutes);

rootRouter.use("/cart", cartRouter);

export default rootRouter;
