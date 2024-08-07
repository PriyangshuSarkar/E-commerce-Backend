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

addressRoutes.delete("/delete/:addressId", authMiddleware, deleteAddress);

addressRoutes.get("/all", authMiddleware, listAddress);

addressRoutes.put("/update/:addressId", authMiddleware, updateAddress);

addressRoutes.put(
  "/shipping/:addressId/default",
  authMiddleware,
  changeDefaultShippingAddress
);

addressRoutes.put(
  "/billing/:addressId/default",
  authMiddleware,
  changeDefaultBillingAddress
);

export default addressRoutes;
