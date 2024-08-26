import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  calculateOrderTotal,
  cancelOrder,
  createOrder,
  getAllOrders,
  getOrderById,
  paymentVerification,
  updateOrder,
} from "../controllers/order";
import { adminMiddleware } from "../middlewares/admin";
import { shiprocketAuth } from "../middlewares/shiprocketAuth";

const orderRouter: Router = Router();

orderRouter.get("/test", shiprocketAuth);

orderRouter.post("/create", authMiddleware, shiprocketAuth, createOrder);

orderRouter.post(
  "/payment/verification",
  authMiddleware,
  shiprocketAuth,
  paymentVerification
);

orderRouter.get("/total", authMiddleware, calculateOrderTotal);

orderRouter.put(
  "/update/:orderId",
  authMiddleware,
  adminMiddleware,
  updateOrder
);

orderRouter.get("/all", authMiddleware, getAllOrders);

orderRouter.get("/get/:orderId", authMiddleware, shiprocketAuth, getOrderById);

orderRouter.put(
  "/cancel/:orderId",
  authMiddleware,
  shiprocketAuth,
  cancelOrder
);

export default orderRouter;
