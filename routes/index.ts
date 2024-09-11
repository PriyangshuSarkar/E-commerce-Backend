import { Router } from "express";
import userRoutes from "./user";
import productRoutes from "./product";
import addressRoutes from "./address";
import cartRouter from "./cart";
import orderRouter from "./order";
import reviewRoutes from "./review";
import categoryRoutes from "./category";
import discountRoutes from "./discount";

const rootRouter: Router = Router();

rootRouter.use("/user", userRoutes);

rootRouter.use("/product", productRoutes);

rootRouter.use("/category", categoryRoutes);

rootRouter.use("/address", addressRoutes);

rootRouter.use("/cart", cartRouter);

rootRouter.use("/order", orderRouter);

rootRouter.use("/review", reviewRoutes);

rootRouter.use("/discount", discountRoutes);

export default rootRouter;
