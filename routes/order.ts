import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
} from "../controllers/order";
import { adminMiddleware } from "../middlewares/admin";

const orderRouter: Router = Router();

orderRouter.post("/create", authMiddleware, createOrder);

orderRouter.put("/update/:id", authMiddleware, adminMiddleware, updateOrder);

orderRouter.get("/all", authMiddleware, getAllOrders);

orderRouter.get("/get/:id", authMiddleware, getOrderById);

orderRouter.put("/cancel/:id", authMiddleware, cancelOrder);

export default orderRouter;
