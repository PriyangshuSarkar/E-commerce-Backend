import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  calculateOrderTotal,
  confirmAndGenerateOrdersCsv,
  confirmOrderCancellation,
  createOrder,
  getAllOrders,
  getOrderById,
  getUserOrders,
  paymentVerification,
  requestOrderCancellation,
  updateOrder,
} from "../controllers/order";
import { adminMiddleware } from "../middlewares/admin";

const orderRouter: Router = Router();

orderRouter.post("/create", authMiddleware, createOrder);

orderRouter.post("/payment/verification", authMiddleware, paymentVerification);

orderRouter.get("/total", authMiddleware, calculateOrderTotal);

orderRouter.put(
  "/update/:orderId",
  authMiddleware,
  adminMiddleware,
  updateOrder
);

orderRouter.get("/all", authMiddleware, adminMiddleware, getAllOrders);

orderRouter.get("/user/all", authMiddleware, getUserOrders);

orderRouter.get("/get/:orderId", authMiddleware, getOrderById);

orderRouter.put(
  "/request/cancel/:orderId",
  authMiddleware,
  requestOrderCancellation
);

orderRouter.put(
  "/cancel/:orderId",
  authMiddleware,
  adminMiddleware,
  confirmOrderCancellation
);

orderRouter.put(
  "/confirm/generate/csv",
  authMiddleware,
  adminMiddleware,
  confirmAndGenerateOrdersCsv
);

export default orderRouter;
