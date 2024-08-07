import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  calculateOrderTotal,
  cancelOrder,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
} from "../controllers/order";
import { adminMiddleware } from "../middlewares/admin";

const orderRouter: Router = Router();

orderRouter.post("/create", authMiddleware, createOrder);

orderRouter.get("/total", authMiddleware, calculateOrderTotal);

orderRouter.put(
  "/update/:orderId",
  authMiddleware,
  adminMiddleware,
  updateOrder
);

orderRouter.get("/all", authMiddleware, getAllOrders);

orderRouter.get("/get/:orderId", authMiddleware, getOrderById);

orderRouter.put("/cancel/:orderId", authMiddleware, cancelOrder);

export default orderRouter;
