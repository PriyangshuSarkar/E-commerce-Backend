import { Router } from "express";
import {
  addAddress,
  changeDefaultBillingAddress,
  changeDefaultShippingAddress,
  deleteAddress,
  listAddress,
  updateAddress,
} from "../controllers/address";
import { authMiddleware } from "../middlewares/auth";

const addressRoutes: Router = Router();

addressRoutes.post("/add", authMiddleware, addAddress);

addressRoutes.delete("/delete/:id", authMiddleware, deleteAddress);

addressRoutes.get("/all", authMiddleware, listAddress);

addressRoutes.put("/update/:id", authMiddleware, updateAddress);

addressRoutes.put(
  "/shipping/default/:id",
  authMiddleware,
  changeDefaultShippingAddress,
);

addressRoutes.put(
  "/billing/default/:id",
  authMiddleware,
  changeDefaultBillingAddress,
);

export default addressRoutes;
