import { Router } from "express";
import userRoutes from "./user";
import productRoutes from "./product";
import addressRoutes from "./address";
import cartRouter from "./cart";
import orderRouter from "./order";
import reviewRoutes from "./review";

const rootRouter: Router = Router();

rootRouter.use("/user", userRoutes);

rootRouter.use("/product", productRoutes);

rootRouter.use("/address", addressRoutes);

rootRouter.use("/cart", cartRouter);

rootRouter.use("/order", orderRouter);

rootRouter.use("/review", reviewRoutes);

export default rootRouter;
